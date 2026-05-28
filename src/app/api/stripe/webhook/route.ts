import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/utils/supabase/service-role'
import { stripe } from '@/utils/stripe'
import { sendOrderConfirmation } from '@/lib/whatsapp/sender'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature') as string

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    if (event.type === 'checkout.session.completed') {
      const sessionData = event.data.object as unknown as Record<string, unknown>

      await handlePaymentConfirmed(sessionData)
    } else if (event.type === 'checkout.session.expired') {
      const obj = event.data.object as unknown as Record<string, unknown>
      console.log('Checkout session expired:', obj.id)
    } else if (event.type === 'payment_intent.payment_failed') {
      console.warn('Payment failed')
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 400 })
  }
}

async function handlePaymentConfirmed(session: Record<string, unknown>) {
  const supabase = createServiceRoleClient()
  const stripeSessionId = session.id as string

  // Find the order by stripe_session_id (via metadata, not RLS since service role bypasses it anyway)
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('stripe_session_id', stripeSessionId)
    .single()

  if (!order) {
    console.warn('Order not found for Stripe session:', stripeSessionId)
    return
  }

  // Update order: confirmed, paid_at, generate verification code
  const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase()

  await supabase
    .from('orders')
    .update({
      payment_status: 'confirmed',
      is_collected: false,
      paid_at: new Date().toISOString(),
      verification_code: verificationCode,
    })
    .eq('id', order.id)

  console.log(`Order ${order.id} confirmed. Verification code: ${verificationCode}`)

  // Send WhatsApp confirmation to customer
  const phone = order.customer_phone?.replace(/\D/g, '')
  if (phone && process.env.TWILIO_ACCOUNT_SID) {
    try {
      await sendOrderConfirmation(phone, order.short_order_id || '', verificationCode, order.total_amount)
    } catch (whatsappError) {
      console.error('Failed to send WhatsApp confirmation:', whatsappError)
    }
  }
}
