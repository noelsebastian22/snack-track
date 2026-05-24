'use server'

import { createServiceRoleClient } from '@/utils/supabase/service-role'

interface HandoverResult {
  success: boolean
  orderId?: string
  error?: string
}

export async function handoverOrder(orderId: string): Promise<HandoverResult> {
  try {
    const supabase = createServiceRoleClient()

    // Fetch the order with its items
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (fetchError || !order) {
      return { success: false, error: 'Order not found' }
    }

    if (order.is_collected) {
      return { success: false, error: 'Order already collected' }
    }

    // Mark order as collected
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        is_collected: true,
        paid_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (orderError) throw orderError

    // Decrement stock for each item in the order
    if (Array.isArray(order.items)) {
      const updates = order.items.map(async (item: { product_id: string; qty: number }) => {
        if (!item.product_id || !item.qty) return

        const { data: product } = await supabase
          .from('products')
          .select('qty_available')
          .eq('id', item.product_id)
          .single()

        if (product && product.qty_available != null) {
          await supabase
            .from('products')
            .update({ qty_available: Math.max(0, product.qty_available - item.qty) })
            .eq('id', item.product_id)
        }
      })

      await Promise.all(updates)
    }

    return { success: true, orderId }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Handover failed',
    }
  }
}
