'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { CheckCircle2, Loader2, ArrowLeft, Copy } from 'lucide-react';

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
  verification_code: string | null;
  short_order_id: string | null;
  is_collected: boolean;
  created_at: string;
}

function VerifySuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    (async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      if (!error && data) setOrder(data);
      setLoading(false);
    })();
  }, [orderId]);

  const handleCopyCode = () => {
    if (order?.verification_code) {
      navigator.clipboard.writeText(order.verification_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F19]">
        <Loader2 className="animate-spin text-[#00C853]" size={48} />
      </div>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-[#0B0F19]">
        <header className="sticky top-0 z-10 bg-[#151C2C]/80 backdrop-blur-md border-b border-[#1E293B] px-5 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/verify')} className="w-10 h-10 rounded-xl bg-[#0B0F19] border border-[#1E293B] flex items-center justify-center hover:border-[#00C853] transition-colors text-[#94A3B8]">
              <ArrowLeft size={20} />
            </button>
            <span className="text-2xl font-black uppercase text-white">Payment Success</span>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4 p-5">
          <CheckCircle2 size={64} className="text-[#00C853]" />
          <h1 className="text-2xl font-black text-white">Order Not Found</h1>
          <p className="text-[#94A3B8] font-medium">Something went wrong. Please contact support.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B0F19]">
      <header className="sticky top-0 z-10 bg-[#151C2C]/80 backdrop-blur-md border-b border-[#1E293B] px-5 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/verify')} className="w-10 h-10 rounded-xl bg-[#0B0F19] border border-[#1E293B] flex items-center justify-center hover:border-[#00C853] transition-colors text-[#94A3B8]">
            <ArrowLeft size={20} />
          </button>
          <span className="text-2xl font-black uppercase text-white">Payment Success</span>
        </div>
      </header>

      <div className="p-5 space-y-5 max-w-2xl">
        {/* Confirmation Banner */}
        <div className="bg-[#00C853] rounded-2xl p-8 text-center space-y-4 shadow-xl">
          <CheckCircle2 size={64} className="mx-auto text-white" />
          <h2 className="text-4xl font-black text-white">ORDER CONFIRMED</h2>
          <p className="text-xs font-bold uppercase tracking-wider text-white/80">Your payment went through!</p>
        </div>

        {/* Verification Code */}
        {order.verification_code && (
          <div className="bg-[#151C2C] rounded-2xl border border-[#00C853]/40 p-6 shadow-xl text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] block mb-3">
              Your Pickup Code
            </span>
            <div className="flex items-center justify-center gap-3">
              <code className="text-5xl font-black text-[#00C853] tracking-widest">{order.verification_code}</code>
              <button
                onClick={handleCopyCode}
                className="w-10 h-10 rounded-xl bg-[#0B0F19] border border-[#1E293B] flex items-center justify-center hover:border-[#00C853] transition-colors text-[#94A3B8] hover:text-white"
                title="Copy code"
              >
                {copied ? <CheckCircle2 size={18} className="text-[#00C853]" /> : <Copy size={18} />}
              </button>
            </div>
          </div>
        )}

        {/* Order Details */}
        <div className="bg-[#151C2C] rounded-2xl border border-[#1E293B] p-6 shadow-xl space-y-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Customer</span>
            <p className="text-xl font-black uppercase mt-1 text-white">{order.customer_name}</p>
          </div>

          {order.short_order_id && (
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Short Order ID</span>
              <code className="block text-lg font-mono mt-1 text-white">{order.short_order_id}</code>
            </div>
          )}

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Items</span>
            {order.items?.map((item, i) => (
              <div key={i} className="flex justify-between items-center p-4 bg-[#0B0F19] rounded-xl">
                <span className="font-black text-white">{item.qty}x {item.name}</span>
                <span className="font-medium text-[#94A3B8]">${(item.price / 100).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-[#1E293B]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Total Paid</span>
            <span className="text-3xl font-black text-[#00C853]">${(order.total_amount / 100).toFixed(2)}</span>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Placed at</span>
            <p className="text-sm text-white mt-1">{new Date(order.created_at).toLocaleString()}</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-[#151C2C] rounded-2xl border border-[#1E293B] p-6 shadow-xl">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#00C853] mb-3">What happens next?</h3>
          <ul className="space-y-2 text-sm text-[#94A3B8] list-disc list-inside">
            <li>Your order has been sent to our kitchen.</li>
            <li>We will notify you when it is ready for pickup.</li>
            <li>Show your pickup code ({order.verification_code || 'pending'}) at the counter.</li>
          </ul>
        </div>

        {/* Back to Search */}
        <button
          onClick={() => router.push('/verify')}
          className="w-full h-14 bg-[#0B0F19] border border-[#1E293B] text-white font-bold rounded-xl hover:border-[#00C853] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft size={20} />
          LOOK UP ANOTHER ORDER
        </button>
      </div>
    </main>
  );
}

export default function VerifySuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F19]">
        <Loader2 className="animate-spin text-[#00C853]" size={48} />
      </div>
    }>
      <VerifySuccessContent />
    </Suspense>
  );
}
