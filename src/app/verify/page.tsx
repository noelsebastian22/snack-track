'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Search, Loader2, AlertTriangle } from 'lucide-react';
import OrderDialog from '@/components/ui/OrderDialog';
import { useToast } from '@/components/ui/ToastProvider';
import { handoverOrder } from '@/app/actions/handover-order';

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
  customer_phone?: string | null;
  items: OrderItem[];
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

  const handleNameSearch = async () => {
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
    <main className="min-h-screen bg-[#0B0F19]">
      <header className="sticky top-0 z-10 bg-[#151C2C]/80 backdrop-blur-md border-b border-[#1E293B] px-5 py-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#00C853]">Verify</span>
          <h1 className="text-2xl font-black uppercase text-white">Find Order</h1>
        </div>
      </header>

      <div className="p-5 space-y-5 max-w-2xl">
        {/* Primary Search */}
        <div className="bg-[#151C2C] rounded-2xl border border-[#1E293B] p-6 shadow-xl">
          <label className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-2 block">
            Search by Customer Name or Phone
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter name or phone number..."
              className="flex-1 bg-[#0B0F19] border border-[#1E293B] rounded-xl text-white px-4 py-3 outline-none focus:border-[#00C853] focus:ring-1 focus:ring-[#00C853] transition-colors"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSearch()}
            />
            <button
              onClick={handleNameSearch}
              disabled={loading || !phone.trim()}
              className="h-12 px-6 bg-[#00C853] text-white font-bold rounded-xl hover:bg-[#00A844] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
              Search
            </button>
          </div>
        </div>

        {searched && orders.length === 0 && !loading && (
          <div className="text-center py-12 text-[#94A3B8]">
            <AlertTriangle size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">No orders found for &ldquo;{phone}&rdquo;</p>
          </div>
        )}

        {orders.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#94A3B8]">
              {orders.length} Order{orders.length !== 1 ? 's' : ''} Found
            </h2>
            {orders.map((order) => (
              <button
                key={order.id}
                onClick={() => router.push(`/verify/${order.id}`)}
                className="w-full text-left p-4 bg-[#151C2C] border border-[#1E293B] rounded-xl hover:border-[#00C853]/50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-black uppercase block text-white">{order.customer_name}</span>
                    <span className="text-xs text-[#94A3B8]">
                      {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''} &middot; ${(order.total_amount / 100).toFixed(2)}
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${
                      order.is_collected
                        ? 'bg-[#1E293B] text-[#94A3B8]'
                        : order.paid_at
                          ? 'bg-[#00C853]/10 text-[#00C853]'
                          : 'bg-[#0B0F19] text-[#94A3B8] border border-[#1E293B]'
                    }`}
                  >
                    {order.is_collected ? 'Collected' : order.paid_at ? 'Paid' : 'Pending'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Manual Verification Fallback */}
        <div className="bg-[#151C2C] rounded-2xl border border-[#1E293B] p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00C853]" />
            Manual Verification Fallback
          </h2>
          <p className="text-xs text-[#64748B]">Search by customer phone number when QR code or order link is unavailable.</p>
          <ManualPhoneFallback />
        </div>
      </div>
    </main>
  );
}

function ManualPhoneFallback() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [handovering, setHandovering] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const handlePhoneSearch = async () => {
    if (!phone.trim()) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .ilike('customer_phone', `%${phone.trim()}%`)
      .eq('is_collected', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!error && data && data.length > 0) {
      setFoundOrder(data[0]);
      setDialogOpen(true);
    } else {
      showToast('error', 'No uncollected order found for this phone number.');
    }

    setLoading(false);
  };

  const handleHandover = useCallback(async (orderId: string) => {
    setHandovering(true);
    const result = await handoverOrder(orderId);
    setHandovering(false);

    if (result.success) {
      setDialogOpen(false);
      setFoundOrder(null);
      router.refresh();
    } else {
      showToast('error', result.error || 'Handover failed');
    }
  }, [router, showToast]);

  return (
    <>
      <div className="flex gap-3">
        <input
          type="tel"
          placeholder="+1234567890"
          className="flex-1 bg-[#0B0F19] border border-[#1E293B] rounded-xl text-white px-4 py-3 outline-none focus:border-[#00C853] focus:ring-1 focus:ring-[#00C853] transition-colors font-mono"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handlePhoneSearch()}
        />
        <button
          onClick={handlePhoneSearch}
          disabled={loading || !phone.trim()}
          className="h-12 px-6 bg-[#00C853] text-white font-bold rounded-xl hover:bg-[#00A844] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
          Search Order
        </button>
      </div>

      <OrderDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setFoundOrder(null); }}
        order={foundOrder}
        onHandover={handleHandover}
        handovering={handovering}
      />
    </>
  );
}
