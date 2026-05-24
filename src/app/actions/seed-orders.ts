'use server'

import { createServiceRoleClient } from '@/utils/supabase/service-role'

interface SeedResult {
  success: boolean
  ordersCreated: number
  error?: string
}

export async function seedTestOrders(): Promise<SeedResult> {
  try {
    const supabase = createServiceRoleClient()

    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('id, name, price')
      .gt('qty_available', 0)

    if (prodError || !products || products.length === 0) {
      return {
        success: false,
        ordersCreated: 0,
        error: 'No active products found. Seed requires products to exist.',
      }
    }

    const pickItems = () => {
      const numItems = Math.random() > 0.5 ? 2 : 1
      const shuffled = [...products].sort(() => 0.5 - Math.random())
      return shuffled.slice(0, numItems).map(p => ({
        product_id: p.id,
        name: p.name,
        price: p.price,
        qty: Math.ceil(Math.random() * 4),
      }))
    }

    const pickTotal = (items: typeof items) => {
      return items.reduce((sum, i) => sum + i.price * i.qty, 0)
    }

    const testOrders = [
      {
        customer_name: 'AHMAD FARIS',
        customer_phone: '+1234567890',
        is_collected: false,
        paid_at: new Date().toISOString(),
      },
      {
        customer_name: 'SARAH LIM',
        customer_phone: '+1234567890',
        is_collected: false,
        paid_at: new Date().toISOString(),
      },
      {
        customer_name: 'RAJ PATEL',
        customer_phone: '+9876543210',
        is_collected: true,
        paid_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        customer_name: 'CHEN WEI',
        customer_phone: '+5555666777',
        is_collected: false,
        paid_at: new Date().toISOString(),
      },
      {
        customer_name: 'AMINA KOCHI',
        customer_phone: '+5555666777',
        is_collected: true,
        paid_at: new Date(Date.now() - 7200000).toISOString(),
      },
    ]

    const inserted: string[] = []
    for (const order of testOrders) {
      const items = pickItems()
      const { data, error } = await supabase
        .from('orders')
        .insert({
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          items: items,
          total_amount: pickTotal(items),
          is_collected: order.is_collected,
          paid_at: order.paid_at,
        })
        .select('id')
        .single()

      if (error) {
        console.error(`Failed to insert order for ${order.customer_name}:`, error.message)
        continue
      }
      inserted.push(data.id)
    }

    return { success: true, ordersCreated: inserted.length }
  } catch (error) {
    return {
      success: false,
      ordersCreated: 0,
      error: error instanceof Error ? error.message : 'Seed failed',
    }
  }
}
