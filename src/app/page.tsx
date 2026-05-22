'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { TrendingUp, Package, AlertTriangle, Clock, QrCode, ListChecks } from 'lucide-react';
import BottomNav from '@/components/layout/BottomNav';

const supabase = createClient();

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent?: string;
}

function MetricCard({ icon, label, value, accent = 'text-secondary' }: MetricCardProps) {
  return (
    <div className="bg-white border-2 border-secondary rounded-bento p-5 shadow-[4px_4px_0px_#1A1C1C] flex items-center gap-4 min-h-[96px]">
      <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{label}</span>
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

export default function DashboardPage() {
  const [revenue, setRevenue] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchData().then(() => {
      if (mounted) {
        const channel = supabase.channel('dashboard-updates');
        channel.on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData);
        channel.on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchData);
        channel.subscribe();
        return () => { supabase.removeChannel(channel); };
      }
    });
    return () => { mounted = false; };
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-secondary text-white px-5 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Dashboard</span>
            <h1 className="text-2xl font-black uppercase">Today&apos;s Overview</h1>
          </div>
          <button
            onClick={fetchData}
            className="w-10 h-10 border-2 border-white rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            aria-label="Refresh data"
          >
            <Clock size={18} />
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-5 space-y-5">
        {/* Top Bento Row — Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            icon={<TrendingUp size={24} className="text-primary" />}
            label="Revenue Today"
            value={`$${(revenue / 100).toFixed(2)}`}
            accent="text-secondary"
          />
          <MetricCard
            icon={<Package size={24} className="text-primary" />}
            label="Pending Collections"
            value={pendingCount}
            accent={pendingCount > 0 ? 'text-primary' : 'text-secondary'}
          />
          <MetricCard
            icon={<AlertTriangle size={24} className="text-error" />}
            label="Low Stock Alerts"
            value={lowStockCount}
            accent={lowStockCount > 0 ? 'text-error' : 'text-secondary'}
          />
        </div>

        {/* Main Content — Two Column Bento */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left — Live Order Stream (2/3 width on desktop) */}
          <div className="lg:col-span-2 bg-white border-2 border-secondary rounded-bento p-5 shadow-[4px_4px_0px_#1A1C1C]">
            <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-4">Live Order Stream</h2>
            {recentOrders.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant">
                <Package size={40} className="mx-auto mb-3 opacity-40" />
                <p className="font-medium">No paid orders yet today</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-surface-container rounded-bento border border-outline-variant"
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="font-black uppercase truncate">{order.customer_name}</span>
                      <span className="text-xs text-on-surface-variant">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''} &middot; ${(order.total_amount / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <span className="text-xs font-bold text-on-surface-variant">{formatTimeAgo(order.paid_at)}</span>
                      {order.is_collected ? (
                        <span className="px-2 py-1 text-xs font-bold uppercase bg-surface-container-highest rounded-full text-on-surface-variant">
                          Done
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-bold uppercase bg-primary/10 text-primary rounded-full">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right — Fast Actions (1/3 width on desktop) */}
          <div className="bg-white border-2 border-secondary rounded-bento p-5 shadow-[4px_4px_0px_#1A1C1C]">
            <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-4">Fast Actions</h2>
            <div className="space-y-3">
              <Link
                href="/verify"
                className="flex items-center gap-4 p-5 bg-surface-container border-2 border-secondary rounded-bento hover:bg-primary/5 transition-colors active:scale-[0.98]"
              >
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white flex-shrink-0">
                  <QrCode size={24} />
                </div>
                <div>
                  <span className="font-black block">Verify Order</span>
                  <span className="text-xs text-on-surface-variant">Scan QR or search by phone</span>
                </div>
              </Link>
              <Link
                href="/inventory"
                className="flex items-center gap-4 p-5 bg-surface-container border-2 border-secondary rounded-bento hover:bg-primary/5 transition-colors active:scale-[0.98]"
              >
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center text-white flex-shrink-0">
                  <ListChecks size={24} />
                </div>
                <div>
                  <span className="font-black block">Inventory</span>
                  <span className="text-xs text-on-surface-variant">Manage stock & products</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
