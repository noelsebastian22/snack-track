'use client'

import { useState, useCallback } from 'react'
import { X, Package2 } from 'lucide-react'

interface OrderItem {
  product_id: string
  name: string
  qty: number
  price: number
}

interface Order {
  id: string
  customer_name: string
  customer_phone?: string | null
  items: OrderItem[]
  total_amount: number
  is_collected: boolean
  paid_at: string | null
  created_at: string
}

interface OrderDialogProps {
  open: boolean
  onClose: () => void
  order: Order | null
  onHandover: (orderId: string) => Promise<void>
  handovering: boolean
}

export default function OrderDialog({ open, onClose, order, onHandover, handovering }: OrderDialogProps) {
  const [handoverState, setHandoverState] = useState<'idle' | 'done'>('idle')

  const handleHandover = useCallback(async () => {
    if (!order) return
    await onHandover(order.id)
    setHandoverState('done')
  }, [order, onHandover])

  if (!open || !order) return null

  const isDone = handoverState === 'done'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={isDone ? undefined : onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md bg-[#151C2C] rounded-2xl border border-[#1E293B] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {isDone ? (
          /* Success State */
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#00C853]/10 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00C853" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="text-xl font-black uppercase text-white">Handover Complete</h3>
            <p className="text-sm text-[#94A3B8]">{order.customer_name}&apos;s order has been marked as collected.</p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-[#00C853] text-white font-bold rounded-xl hover:bg-[#00A844] active:scale-[0.98] transition-all"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#00C853]/10 flex items-center justify-center">
                  <Package2 size={16} className="text-[#00C853]" />
                </div>
                <span className="font-black uppercase text-white text-sm tracking-wide">Order Found</span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-[#0B0F19] flex items-center justify-center text-[#94A3B8] hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Customer</span>
                <p className="text-lg font-black uppercase mt-1 text-white">{order.customer_name}</p>
              </div>

              {order.customer_phone && (
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Phone</span>
                  <p className="font-mono text-sm mt-1 text-white">{order.customer_phone}</p>
                </div>
              )}

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Order ID</span>
                <p className="font-mono text-xs mt-1 text-[#94A3B8] break-all">{order.id}</p>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Items</span>
                <ul className="mt-2 space-y-2">
                  {order.items.map((item, i) => (
                    <li key={i} className="flex justify-between items-center p-3 bg-[#0B0F19] rounded-xl">
                      <div>
                        <span className="font-bold text-white text-sm">{item.name}</span>
                        <span className="text-xs text-[#94A3B8] ml-2">x{item.qty}</span>
                      </div>
                      <span className="font-medium text-sm text-white">${((item.price * item.qty) / 100).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-[#1E293B]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Total</span>
                <span className="text-2xl font-black text-[#00C853]">${(order.total_amount / 100).toFixed(2)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#1E293B]">
              <button
                onClick={handleHandover}
                disabled={handovering}
                className="w-full h-14 bg-[#00C853] text-white text-lg font-bold tracking-wide rounded-xl hover:bg-[#00A844] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {handovering ? (
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Handover Success'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
