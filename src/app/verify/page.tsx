'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Search, Loader2, AlertTriangle } from 'lucide-react';
import BottomNav from '@/components/layout/BottomNav';

const supabase = createClient();

interface Order {
  id: string;
  customer_name: string;
  items: { product_id: string; name: string; qty: number; price: number }[];
  total_amount: number;
  is_collected: boolean;
  paid_at: string | null;
  created_at: string;
}

export default function VerifyLookupPage() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searched, setSearched] = useState(false);
  const router = useRouter();

  const handleSearch = async () => {
    if (!phone.trim()) return;
    setLoading(true);
    setSearched(true);

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .ilike('customer_name', `%${phone.trim()}%`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) setOrders(data);
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-secondary text-white px-5 py-4">
        <div className="max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Verify</span>
          <h1 className="text-2xl font-black uppercase">Find Order</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-5 space-y-5">
        <div className="bg-white border-2 border-secondary rounded-bento p-5 shadow-[4px_4px_0px_#1A1C1C]">
          <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 block">
            Search by Customer Name or Phone
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter name or phone number..."
              className="flex-1 p-3 border-2 border-secondary rounded-lg font-medium outline-none focus:border-primary transition-colors"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !phone.trim()}
              className="h-12 px-6 bg-primary text-white font-bold rounded-lg border-2 border-secondary shadow-[4px_4px_0px_#1A1C1C] active:translate-y-0.5 active:shadow-none flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
              Search
            </button>
          </div>
        </div>

        {searched && orders.length === 0 && !loading && (
          <div className="text-center py-12 text-on-surface-variant">
            <AlertTriangle size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">No orders found for &ldquo;{phone}&rdquo;</p>
          </div>
        )}

        {orders.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">
              {orders.length} Order{orders.length !== 1 ? 's' : ''} Found
            </h2>
            {orders.map((order) => (
              <button
                key={order.id}
                onClick={() => router.push(`/verify/${order.id}`)}
                className="w-full text-left p-4 bg-white border-2 border-secondary rounded-bento shadow-[4px_4px_0px_#1A1C1C] hover:bg-primary/5 transition-colors active:scale-[0.98]"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-black uppercase block">{order.customer_name}</span>
                    <span className="text-xs text-on-surface-variant">
                      {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''} &middot; ${(order.total_amount / 100).toFixed(2)}
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${
                      order.is_collected
                        ? 'bg-surface-container-highest text-on-surface-variant'
                        : order.paid_at
                          ? 'bg-primary/10 text-primary'
                          : 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    {order.is_collected ? 'Collected' : order.paid_at ? 'Paid' : 'Pending'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
