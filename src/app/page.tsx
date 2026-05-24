'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { TrendingUp, Package, AlertTriangle, Clock, QrCode, ListChecks } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const supabase = createClient();

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent?: string;
}

function MetricCard({ icon, label, value, accent = 'text-[#94A3B8]' }: MetricCardProps) {
  return (
    <div className="bg-[#151C2C] rounded-2xl border border-[#1E293B] p-5 shadow-xl flex items-center gap-4 min-h-[96px]">
      <div className="w-12 h-12 rounded-xl bg-[#0B0F19] flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">{label}</span>
        <span className={`text-3xl font-black ${accent}`}>{value}</span>
      </div>
    </div>
  );
}

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

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return '\u2014';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

interface DailyProfitData {
  time: string;
  profit: number;
}

export default function DashboardPage() {
  const [revenue, setRevenue] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyProfitData, setDailyProfitData] = useState<DailyProfitData[]>([]);

  const fetchData = useCallback(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const [revenueRes, pendingRes, lowStockRes, ordersRes] = await Promise.all([
      supabase.from('orders').select('total_amount').gte('paid_at', todayISO).not('paid_at', 'is', null),
      supabase.from('orders').select('id').not('paid_at', 'is', null).eq('is_collected', false),
      supabase.from('products').select('id').lt('qty_available', 10),
      supabase.from('orders').select('*').not('paid_at', 'is', null).order('paid_at', { ascending: false }).limit(20),
    ]);

    if (revenueRes.data) setRevenue(revenueRes.data.reduce((sum, o) => sum + (o.total_amount || 0), 0));
    if (pendingRes.data) setPendingCount(pendingRes.data.length);
    if (lowStockRes.data) setLowStockCount(lowStockRes.data.length);
    if (ordersRes.data) setRecentOrders(ordersRes.data);

    // Build daily profit chart data from orders
    if (ordersRes.data) {
      const profitMap: Record<string, number> = {};
      ordersRes.data.forEach((order) => {
        if (order.paid_at) {
          const date = new Date(order.paid_at).toLocaleDateString();
          profitMap[date] = (profitMap[date] || 0) + order.total_amount;
        }
      });
      const chartData: DailyProfitData[] = Object.entries(profitMap)
        .map(([time, profit]) => ({ time, profit }))
        .sort((a, b) => a.time.localeCompare(b.time));
      setDailyProfitData(chartData);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    const channel = supabase.channel('dashboard-updates');
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData);
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchData);
    channel.subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        console.warn('Supabase Realtime not enabled — live updates disabled. Enable it in Supabase Dashboard → Database → Replication.');
      }
    });
    fetchData();
    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F19]">
        <div className="w-10 h-10 border-4 border-[#00C853] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B0F19]">
      <header className="sticky top-0 z-10 bg-[#151C2C]/80 backdrop-blur-md border-b border-[#1E293B] px-5 py-4">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#00C853]">Dashboard</span>
            <h1 className="text-2xl font-black uppercase text-white">Today&apos;s Overview</h1>
          </div>
          <button
            onClick={fetchData}
            className="w-10 h-10 rounded-xl bg-[#0B0F19] border border-[#1E293B] flex items-center justify-center hover:border-[#00C853] transition-colors text-[#94A3B8] hover:text-white"
            aria-label="Refresh data"
          >
            <Clock size={18} />
          </button>
        </div>
      </header>

      <div className="p-5 space-y-5">
        {/* Top Bento Row - Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            icon={<TrendingUp size={24} className="text-[#00C853]" />}
            label="Revenue Today"
            value={`$${(revenue / 100).toFixed(2)}`}
            accent="text-white"
          />
          <MetricCard
            icon={<Package size={24} className="text-[#00C853]" />}
            label="Pending Collections"
            value={pendingCount}
            accent={pendingCount > 0 ? 'text-[#00C853]' : 'text-white'}
          />
          <MetricCard
            icon={<AlertTriangle size={24} className="text-[#EF4444]" />}
            label="Low Stock Alerts"
            value={lowStockCount}
            accent={lowStockCount > 0 ? 'text-[#EF4444]' : 'text-white'}
          />
        </div>

        {/* Main Content - Bento Box Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left - Live Order Stream */}
          <div className="lg:col-span-2 bg-[#151C2C] rounded-2xl border border-[#1E293B] p-6 shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#94A3B8] mb-4">Live Order Stream</h2>
            {recentOrders.length === 0 ? (
              <div className="text-center py-12 text-[#94A3B8]">
                <Package size={40} className="mx-auto mb-3 opacity-40" />
                <p className="font-medium">No paid orders yet today</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-[#0B0F19] rounded-xl hover:bg-[#1E293B]/40 transition-colors"
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="font-black uppercase text-white truncate">{order.customer_name}</span>
                      <span className="text-xs text-[#94A3B8]">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''} &middot; ${(order.total_amount / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <span className="text-xs font-bold text-[#94A3B8]">{formatTimeAgo(order.paid_at)}</span>
                      {order.is_collected ? (
                        <span className="px-2 py-1 text-xs font-bold uppercase bg-[#1E293B] text-[#94A3B8] rounded-full">
                          Done
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-bold uppercase bg-[#00C853]/10 text-[#00C853] rounded-full">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right - Telemetry + Actions */}
          <div className="space-y-5">
            {/* Real-time Telemetry - Area Chart */}
            <div className="bg-[#151C2C] rounded-2xl border border-[#1E293B] p-6 shadow-xl">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#94A3B8] mb-4">Daily Profit Progress</h2>
              {dailyProfitData.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-[#94A3B8] text-sm">
                  No profit data yet
                </div>
              ) : (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyProfitData}>
                      <defs>
                        <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00C853" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#151C2C" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 100).toFixed(0)}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#151C2C', border: '1px solid #1E293B', borderRadius: '12px', color: '#FFFFFF' }}
                        formatter={(value) => [`$${((Number(value) || 0) / 100).toFixed(2)}`, 'Profit']}
                      />
                      <Area
                        type="monotone"
                        dataKey="profit"
                        stroke="#00C853"
                        strokeWidth={2}
                        fill="url(#profitGradient)"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Fast Actions */}
            <div className="bg-[#151C2C] rounded-2xl border border-[#1E293B] p-6 shadow-xl">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#94A3B8] mb-4">Fast Actions</h2>
              <div className="space-y-3">
                <Link
                  href="/verify"
                  className="flex items-center gap-4 p-4 bg-[#0B0F19] rounded-xl border border-[#1E293B] hover:border-[#00C853] transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#00C853]/10 flex items-center justify-center text-[#00C853] flex-shrink-0">
                    <QrCode size={24} />
                  </div>
                  <div>
                    <span className="font-black block text-white text-sm">Verify Order</span>
                    <span className="text-xs text-[#94A3B8]">Scan QR or search by phone</span>
                  </div>
                </Link>
                <Link
                  href="/inventory"
                  className="flex items-center gap-4 p-4 bg-[#0B0F19] rounded-xl border border-[#1E293B] hover:border-[#00C853] transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#0B0F19] flex items-center justify-center text-[#00C853] flex-shrink-0">
                    <ListChecks size={24} />
                  </div>
                  <div>
                    <span className="font-black block text-white text-sm">Inventory</span>
                    <span className="text-xs text-[#94A3B8]">Manage stock & products</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
