import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/utils/supabase/service-role'

interface SessionState {
  state: string
  cart: Array<{ name: string; qty: number }>
  updatedAt: number
}

const TWILIO_SESSIONS_TABLE = 'waba_sessions'

/**
 * Get or create a session for this phone number.
 * We use Supabase to persist conversation state across messages.
 */
async function getSession(phone: string): Promise<SessionState> {
  const supabase = createServiceRoleClient()

  // Use Supabase row locking: ON CONFLICT DO UPDATE trick
  // For simplicity, we'll store state in a dedicated table
  const { data: existing } = await supabase
    .from(TWILIO_SESSIONS_TABLE)
    .select('state, cart, updated_at')
    .eq('phone_number', phone)
    .single()

  if (existing && isSessionActive(existing.updated_at)) {
    return {
      state: existing.state as string,
      cart: Array.isArray(existing.cart) ? existing.cart : [],
      updatedAt: new Date(existing.updated_at).getTime(),
    }
  }

  return { state: 'idle', cart: [], updatedAt: Date.now() }
}

/**
 * Save session state for a phone number.
 */
async function saveSession(phone: string, session: SessionState): Promise<void> {
  const supabase = createServiceRoleClient()

  await supabase
    .from(TWILIO_SESSIONS_TABLE)
    .upsert(
      {
        phone_number: phone,
        state: session.state,
        cart: session.cart,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'phone_number' }
    )
}

/**
 * Clean up stale sessions (idle for > 15 min).
 */
async function cleanupStaleSessions(): Promise<void> {
  const supabase = createServiceRoleClient()
  await supabase.from(TWILIO_SESSIONS_TABLE).delete().lte('updated_at', new Date(Date.now() - 900_000).toISOString())
}

function isSessionActive(updatedAt: number): boolean {
  return Date.now() - updatedAt < 900_000 // 15 min timeout
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData()
    const fromPhone = body.get('From') as string
    const messageBody = (body.get('Body') as string) || ''

    if (!fromPhone || !messageBody) {
      return NextResponse.json({ error: 'Missing From or Body' }, { status: 400 })
    }

    const session = await getSession(fromPhone)
    const twiml = await handleMessage(session, fromPhone, messageBody.trim())

    // If the response was an order confirmation, don't save state — we're done.
    if (twiml.includes('order confirmed') || twiml.includes('Order placed')) {
      // Delete stale session
      const supabase = createServiceRoleClient()
      await supabase.from(TWILIO_SESSIONS_TABLE).delete().eq('phone_number', fromPhone)
    } else {
      // Save updated session state (async, non-blocking)
      void saveSession(fromPhone, {
        ...session,
        updatedAt: Date.now(),
      })
    }

    return new NextResponse(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    })
  } catch (error) {
    console.error('Twilio webhook error:', error)
    return new NextResponse(
      '<Response><Message>Sorry, something went wrong. Try again later.</Message></Response>',
      { status: 500, headers: { 'Content-Type': 'text/xml' } }
    )
  }
}

async function handleMessage(
  session: SessionState, 
  phone: string, 
  message: string
): Promise<string> {
  const normalized = message.toLowerCase().trim()

  // Command routing
  if (normalized === 'menu' || normalized === 'show menu') {
    session.state = 'idle'
    session.cart = []
    await saveSession(phone, { ...session, updatedAt: Date.now() })
    return sendMenu(session)
  }
  if (normalized === 'cancel' || normalized === 'no') {
    return resetSession(phone, session)
  }
  if (normalized === 'yes' || normalized === 'confirm') {
    if (session.cart && session.cart.length > 0) {
      return processOrder(session, phone)
    }
    return sendMenu(session) // fallback
  }

  // If we have a cart, treat this as "add item" continuation
  if ((session.cart && session.cart.length > 0) && session.state !== 'payment_sent') {
    const newItems = parseItemsFromMessage(message)
    if (newItems.length > 0) {
      session.cart = [...session.cart, ...newItems]
      session.state = 'building_cart'
      await saveSession(phone, { ...session, updatedAt: Date.now() })
      return showCartSummary(session, phone)
    }
  }

  // Try to parse items directly (single-item order flow)
  const newItems = parseItemsFromMessage(message)
  if (newItems.length > 0) {
    session.cart = [...(session.cart || []), ...newItems]
    session.state = 'building_cart'
    await saveSession(phone, { ...session, updatedAt: Date.now() })
    
    // Ask for more items or to confirm
    return showCartSummary(session, phone)
  }

  // Fallback
  return sendMenu(session)
}

function parseItemsFromMessage(message: string): Array<{ name: string; qty: number }> {
  const items: Array<{ name: string; qty: number }> = []
  const regex = /(\d+)\s*x?\s*([a-zA-Z][a-zA-Z0-9\s]{2,})/g
  let match

  while ((match = regex.exec(message)) !== null) {
    const qty = parseInt(match[1], 10)
    const name = match[2].trim()
    if (qty > 0 && name.length >= 3) {
      items.push({ name, qty })
    }
  }

  return items
}

async function sendMenu(session: SessionState): Promise<string> {
  const supabase = createServiceRoleClient()
  
  const { data: products } = await supabase
    .from('products')
    .select('name, price, qty_available')
    .eq('is_active', true)
    .gt('qty_available', 0)
    .order('name')

  const menuText = (products || [])
    .map((p, i) => `${i + 1}. ${p.name} — $${(p.price / 100).toFixed(2)} (${p.qty_available} left)`)
    .join('\n')

  return `<Response><Message>Here's our menu:

${menuText || '(No items currently available)'}

Reply with quantity and name, e.g. "2x Samosa" or "1x Chicken Pie".
Send "menu" anytime. Send "cancel" to start over.</Message></Response>`
}

async function resetSession(phone: string, session: SessionState): Promise<string> {
  const supabase = createServiceRoleClient()
  await supabase.from(TWILIO_SESSIONS_TABLE).delete().eq('phone_number', phone)
  
  return `<Response><Message>Order cancelled. Send "menu" to start a new order.</Message></Response>`
}

async function showCartSummary(session: SessionState, phone: string): Promise<string> {
  const supabase = createServiceRoleClient()
  const { data: allProducts } = await supabase
    .from('products')
    .select('id, name, price, qty_available')
    .eq('is_active', true)
    .gt('qty_available', 0)
    .order('name')

  let orderTotal = 0
  const lines: string[] = ['Order so far:']

  for (const item of session.cart || []) {
    const matched = allProducts?.find(p => {
      const words = item.name.toLowerCase().split(/\s+/)
      return words.every(w => p.name.toLowerCase().includes(w))
    })

    if (matched) {
      lines.push(`${item.qty}x ${matched.name} — $${((matched.price * item.qty) / 100).toFixed(2)}`)
      orderTotal += matched.price * item.qty
    } else {
      lines.push(`${item.qty}x ${item.name} (not found)`)
    }
  }

  lines.push(`\nTotal: $${(orderTotal / 100).toFixed(2)}`)
  lines.push('\nReply "yes" or "confirm" to place this order.')
  lines.push('Send more items to add, or "cancel" to start over.')

  return `<Response><Message>${lines.join('\n')}</Message></Response>`
}

async function processOrder(session: SessionState, phone: string): Promise<string> {
  const supabase = createServiceRoleClient()
  const { data: allProducts } = await supabase
    .from('products')
    .select('id, name, price, qty_available')
    .eq('is_active', true)
    .gt('qty_available', 0)
    .order('name')

  if (!session.cart || session.cart.length === 0) {
    return `<Response><Message>Your cart is empty. Send "menu" to start ordering.</Message></Response>`
  }

  // Validate stock and build order payload
  const orderItems: Array<{ product_id: string; name: string; qty: number; price: number }> = []
  let totalAmount = 0

  for (const item of session.cart) {
    const matched = allProducts?.find(p => {
      const words = item.name.toLowerCase().split(/\s+/)
      return words.every(w => p.name.toLowerCase().includes(w))
    })

    if (!matched) {
      return `<Response><Message>We couldn't find "${item.name}" in the menu. Send "menu" to see available items.</Message></Response>`
    }
    if (matched.qty_available < item.qty) {
      return `<Response><Message>Sorry, only ${matched.qty_available} of ${matched.name} are left.</Message></Response>`
    }

    orderItems.push({ product_id: matched.id, name: matched.name, qty: item.qty, price: matched.price })
    totalAmount += matched.price * item.qty
  }

  // Create Stripe checkout session
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/create-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_phone: phone.replace('+', ''),
      customer_name: phone, // Will be overridden in checkout if name provided
      items: orderItems.map(i => ({ product_id: i.product_id, name: i.name, qty: i.qty })),
      total_amount: totalAmount,
    }),
  })

  if (!res.ok) {
    console.error('Checkout API error:', await res.text())
    return `<Response><Message>Sorry, we had trouble creating your order. Try again.</Message></Response>`
  }

  const { url } = await res.json() as { url: string; orderId: string }

  // Send payment link and go into payment_sent state
  return `<Response><Message>Great! Complete your payment here:

${url}

Your short order ID will appear after payment. Reply "menu" to start over.</Message></Response>`
}
