'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import InventoryCard from '@/components/products/InventoryCard';
import { RefreshCcw, Database, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { seedTestOrders } from '@/app/actions/seed-orders';

const supabase = createClient();

interface Product {
  id: string;
  name: string;
  qty_available: number;
  image_url: string;
}

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [seedState, setSeedState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const fetchInventory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInventory();
    
    const channel = supabase
      .channel('inventory-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchInventory();
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('Supabase Realtime not enabled — live updates disabled.');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSeed = async () => {
    setSeedState('loading');
    const result = await seedTestOrders();
    
    if (result.success) {
      setSeedState('success');
      setTimeout(() => setSeedState('idle'), 3000);
      fetchInventory();
    } else {
      setSeedState('error');
      setTimeout(() => setSeedState('idle'), 4000);
    }
  };

  return (
    <main className="min-h-screen bg-[#0B0F19]">
      <header className="sticky top-0 z-10 bg-[#151C2C]/80 backdrop-blur-md border-b border-[#1E293B] px-5 py-4">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#00C853]">Stock Dashboard</span>
            <h1 className="text-2xl font-black uppercase text-white">Daily Setup</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Seed Test Data Button */}
            <button
              onClick={handleSeed}
              disabled={seedState === 'loading'}
              className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${
                seedState === 'error'
                  ? 'border-[#EF4444]/30 text-[#EF4444] hover:border-[#EF4444]'
                  : seedState === 'success'
                    ? 'border-[#00C853]/30 text-[#00C853] hover:border-[#00C853]'
                    : 'bg-[#0B0F19] border-[#1E293B] text-[#94A3B8] hover:text-white hover:border-[#00C853]'
              }`}
              title="Seed test data"
            >
              {seedState === 'loading' ? (
                <Loader2 className="animate-spin" size={18} />
              ) : seedState === 'success' ? (
                <CheckCircle2 size={18} />
              ) : seedState === 'error' ? (
                <XCircle size={18} />
              ) : (
                <Database size={18} />
              )}
            </button>

            {/* Refresh Button */}
            <button 
              onClick={fetchInventory}
              className={`w-10 h-10 rounded-xl bg-[#0B0F19] border border-[#1E293B] flex items-center justify-center hover:border-[#00C853] transition-colors text-[#94A3B8] ${loading ? 'animate-spin' : ''}`}
            >
              <RefreshCcw size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Seed Feedback Banner */}
      {seedState === 'success' && (
        <div className="px-5 pt-4">
          <div className="bg-[#00C853]/10 border border-[#00C853]/20 rounded-xl px-4 py-3 flex items-center gap-3">
            <CheckCircle2 size={16} className="text-[#00C853] flex-shrink-0" />
            <span className="text-sm font-bold text-[#00C853]">Test data seeded successfully.</span>
          </div>
        </div>
      )}
      {seedState === 'error' && (
        <div className="px-5 pt-4">
          <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl px-4 py-3 flex items-center gap-3">
            <XCircle size={16} className="text-[#EF4444] flex-shrink-0" />
            <span className="text-sm font-bold text-[#EF4444]">Failed to seed data. Ensure the customer_phone column exists in the orders table.</span>
          </div>
        </div>
      )}

      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <InventoryCard 
              key={product.id} 
              product={product} 
              onRefresh={() => {}}
            />
          ))}
        </div>

        {products.length === 0 && !loading && (
          <div className="text-center py-16 text-[#94A3B8]">
            <p className="font-medium">No active products found.</p>
            <a href="/admin/products" className="text-[#00C853] font-semibold text-sm mt-2 inline-block">Go to Menu Manager</a>
          </div>
        )}
      </div>
    </main>
  );
}
