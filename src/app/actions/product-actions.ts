'use server'

import { createServiceRoleClient } from '@/utils/supabase/service-role'

export type UploadResult = {
  success: boolean
  imageUrl?: string
  error?: string
}

export async function uploadProductImage(base64Data: string): Promise<UploadResult> {
  try {
    const supabase = createServiceRoleClient()

    // Strip data URL prefix if present (e.g. "data:image/png;base64,")
    const base64Str = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data
    const buffer = Buffer.from(base64Str, 'base64')

    // Extract MIME type from data URL header for correct file extension
    const mimeMatch = base64Data.match(/^data:(image\/\w+)/)
    const ext = mimeMatch ? mimeMatch[1].split('/')[1] : 'png'
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('snack-images')
      .upload(fileName, buffer)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage.from('snack-images').getPublicUrl(fileName)

    return { success: true, imageUrl: publicUrl }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Upload failed' }
  }
}

export type ProductInput = {
  name: string
  description?: string | null
  price: number
  image_url?: string | null
  is_active?: boolean
  qty_available?: number
  id?: string
}

export async function saveProduct(input: ProductInput): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceRoleClient()

    if (input.id) {
      // UPDATE existing product
      const { error } = await supabase
        .from('products')
        .update({
          name: input.name,
          description: input.description || null,
          price: input.price,
          image_url: input.image_url || null,
          is_active: input.is_active ?? true,
          qty_available: input.qty_available ?? 0,
        })
        .eq('id', input.id)

      if (error) throw error
    } else {
      // INSERT new product
      const { error } = await supabase.from('products').insert({
        name: input.name,
        description: input.description || null,
        price: input.price,
        image_url: input.image_url || null,
        is_active: input.is_active ?? true,
        qty_available: input.qty_available ?? 0,
      })

      if (error) throw error
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to save product' }
  }
}

export async function deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceRoleClient()

    const { error } = await supabase.from('products').delete().eq('id', id)

    if (error) throw error

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete product' }
  }
}

export async function updateProductQty(id: string, qty_available: number): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceRoleClient()

    const { error } = await supabase
      .from('products')
      .update({ qty_available })
      .eq('id', id)

    if (error) throw error

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update quantity' }
  }
}

export async function toggleProductActive(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceRoleClient()

    const { data: existing } = await supabase.from('products').select('is_active').eq('id', id).single()

    if (!existing) {
      return { success: false, error: 'Product not found' }
    }

    const { error } = await supabase
      .from('products')
      .update({ is_active: !existing.is_active })
      .eq('id', id)

    if (error) throw error

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to toggle product' }
  }
}
