import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/utils/supabase/service-role'

export async function GET() {
  const supabase = createServiceRoleClient()

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, description, price, qty_available')
    .eq('is_active', true)
    .gt('qty_available', 0)
    .order('name')

  if (error) {
    console.error('Menu fetch error:', error)
    return NextResponse.json({ error: 'Failed to load menu' }, { status: 500 })
  }

  const items = products.map(p => ({
    id: p.id,
    name: p.name,
    price_cents: p.price,
    price_display: `$${(p.price / 100).toFixed(2)}`,
    qty_available: p.qty_available,
    description: p.description,
  }))

  return NextResponse.json({ items })
}
