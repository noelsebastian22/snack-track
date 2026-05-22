'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { CheckCircle2, AlertTriangle, Loader2, PackageCheck, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import BottomNav from '@/components/layout/BottomNav';

const supabase = createClient();

interface OrderItem {
  product_id: string;
  name: string;
  qty: number;
  price: number;
}

interface Order {
  id: string;
  customer_name: string;
  items: OrderItem[];
  total_amount: number;
  is_collected: boolean;
  paid_at: string | null;
  created_at: string;
}

export default function VerifyOrderPage() {
  const { order_id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('orders').select('*').eq('id', order_id).single();
    if (!error && data) setOrder(data);
    setLoading(false);
  }, [order_id]);

  useEffect(() => {
    if (order_id) fetchOrder();
  }, [order_id, fetchOrder]);

  const handleHandover = async () => {
    if (!order) return;
    setProcessing(true);

    try {
      const { error: orderError } = await supabase
        .from('orders')
        .update({ is_collected: true })
        .eq('id', order.id);

      if (orderError) throw orderError;

      const itemUpdates = order.items.map(async (item) => {
        const { data: product } = await supabase
          .from('products')
          .select('qty_available')
          .eq('id', item.product_id)
          .single();

        if (product) {
          await supabase
            .from('products')
            .update({ qty_available: Math.max(0, product.qty_available - item.qty) })
            .eq('id', item.product_id);
        }
      });

      await Promise.all(itemUpdates);

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF8C00', '#2E7D32', '#1A1C1C'],
      });

      await fetchOrder();
    } catch (error) {
      console.error('Handover failed:', error);
      alert('Handover failed. Check console for details.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-10 bg-secondary text-white px-5 py-4">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button onClick={() => router.push('/verify')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <span className="text-2xl font-black uppercase">Verify Order</span>
          </div>
        </header>
        <div className="max-w-2xl mx-auto p-5 flex flex-col items-center justify-center py-20 text-center gap-4">
          <AlertTriangle size={64} className="text-error" />
          <h1 className="text-2xl font-black">Order Not Found</h1>
          <p className="text-on-surface-variant font-medium">This verification link is invalid or the order does not exist.</p>
          <button
            onClick={() => router.push('/verify')}
            className="mt-4 px-6 py-3 bg-primary text-white font-bold rounded-lg border-2 border-secondary shadow-[4px_4px_0px_#1A1C1C] active:translate-y-0.5 active:shadow-none"
          >
            Back to Search
          </button>
        </div>
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-secondary text-white px-5 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => router.push('/verify')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <span className="text-2xl font-black uppercase">Verify Order</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-5 space-y-5">
        {/* Status Banner */}
        {order.is_collected ? (
          <div className="bg-surface-container-highest border-2 border-error rounded-bento p-8 text-center space-y-4 shadow-[4px_4px_0px_#1A1C1C]">
            <AlertTriangle size={64} className="mx-auto text-error" />
            <h2 className="text-3xl font-black text-error">ALREADY COLLECTED</h2>
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Handed over at: {order.paid_at ? new Date(order.paid_at).toLocaleTimeString() : 'Unknown'}
            </p>
          </div>
        ) : (
          <div className="bg-success border-2 border-success rounded-bento p-8 text-center space-y-4 text-white shadow-[4px_4px_0px_#1A1C1C]">
            <CheckCircle2 size={64} className="mx-auto" />
            <h2 className="text-4xl font-black">VERIFIED</h2>
            <p className="text-xs font-bold uppercase tracking-wider opacity-80">Ready for Handover</p>
          </div>
        )}

        {/* Order Details */}
        <div className="bg-white border-2 border-secondary rounded-bento p-5 shadow-[4px_4px_0px_#1A1C1C] space-y-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Customer</span>
            <p className="text-xl font-black uppercase mt-1">{order.customer_name}</p>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Items</span>
            {order.items?.map((item, i) => (
              <div key={i} className="flex justify-between items-center p-4 bg-surface-container border border-outline-variant rounded-lg">
                <span className="font-black">{item.qty}x {item.name}</span>
                <span className="font-medium">${(item.price / 100).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t-2 border-dashed border-outline">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Total Paid</span>
            <span className="text-3xl font-black text-primary">${(order.total_amount / 100).toFixed(2)}</span>
          </div>
        </div>

        {/* Handover Button */}
        {!order.is_collected && (
          <button
            onClick={handleHandover}
            disabled={processing}
            className="w-full h-16 bg-primary text-white text-xl font-black rounded-bento border-2 border-secondary shadow-[6px_6px_0px_#1A1C1C] active:translate-y-1 active:shadow-none flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {processing ? (
              <Loader2 className="animate-spin" size={28} />
            ) : (
              <>
                <PackageCheck size={28} />
                CONFIRM HANDOVER & COMPLETE
              </>
            )}
          </button>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
