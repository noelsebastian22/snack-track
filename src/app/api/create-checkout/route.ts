import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/utils/supabase/service-role'
import { stripe } from '@/utils/stripe'
import { generateShortOrderId } from '@/lib/verification-code'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { customer_name, customer_phone, items, total_amount } = body

    if (!customer_name || !customer_phone || !items || !Array.isArray(items) || !total_amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // Validate all products exist and have enough stock, collect prices
    const productPrices: Record<string, number> = {}
    for (const item of items) {
      const { data: product, error } = await supabase
        .from('products')
        .select('id, qty_available, price')
        .eq('id', item.product_id)
        .single()

      if (error || !product) {
        return NextResponse.json({ error: `Product not found: ${item.name}` }, { status: 400 })
      }
      if (product.qty_available < item.qty) {
        return NextResponse.json(
          { error: `Insufficient stock for ${item.name}: only ${product.qty_available} available` },
          { status: 400 }
        )
      }
      productPrices[item.product_id] = product.price
    }

    // Create Stripe Checkout session
    const stripeSession = await stripe.checkout.sessions.create({
      customer_email: undefined, // Let Stripe collect it if they provide a phone number in metadata
      payment_method_types: ['card'],
      line_items: items.map((item: { name: string; price: number; qty: number }) => ({
        price_data: {
          currency: 'sgd',
          product_data: {
            name: item.name,
          },
          unit_amount: item.price,
        },
        quantity: item.qty,
      })),
      metadata: {
        customer_name,
        customer_phone,
      },
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || req.headers.get('origin')}/verify/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || req.headers.get('origin')}/verify`,
    })

    // Store order in database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name,
        customer_phone,
        items: items.map((item: { product_id: string; name: string; qty: number }) => ({
          product_id: item.product_id,
          name: item.name,
          price: productPrices[item.product_id],
          qty: item.qty,
        })),
        total_amount,
        payment_status: 'pending',
        is_collected: false,
        short_order_id: generateShortOrderId(customer_name, customer_phone),
      })
      .select('*')
      .single()

    if (orderError) {
      // Stripe session will expire naturally after 24h since order creation failed
      console.error('Failed to create order:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Update order with Stripe session ID
    await supabase
      .from('orders')
      .update({ stripe_session_id: stripeSession.id })
      .eq('id', order.id)

    return NextResponse.json({ url: stripeSession.url, orderId: order.id })
  } catch (error) {
    console.error('create-checkout error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
