'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import InventoryCard from '@/components/products/InventoryCard';
import BottomNav from '@/components/layout/BottomNav';
import { RefreshCcw } from 'lucide-react';

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
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('inventory-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        // We could do a more surgical update, but for now we'll just refresh
        fetchInventory();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <main className="min-h-screen pb-[var(--spacing-touch-target)] bg-[var(--color-surface)]">
      {/* Header */}
      <header className="p-4 bg-[var(--color-secondary)] text-white sticky top-0 z-10">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <div>
            <span className="label-bold text-[var(--color-primary)]">Stock Dashboard</span>
            <h1 className="headline-lg uppercase italic">Daily Setup</h1>
          </div>
          <button 
            onClick={fetchInventory}
            className={`p-2 border-2 border-white rounded-full ${loading ? 'animate-spin' : ''}`}
          >
            <RefreshCcw size={20} />
          </button>
        </div>
      </header>

      <div className="p-4 max-w-md mx-auto">
        <div className="grid grid-cols-2 gap-4">
          {products.map((product) => (
            <InventoryCard 
              key={product.id} 
              product={product} 
              onRefresh={() => {}} // Stepper handles optimistic UI
            />
          ))}
        </div>

        {products.length === 0 && !loading && (
          <div className="text-center p-12 space-y-4">
            <p className="body-md text-[var(--color-outline)]">No active products found.</p>
            <a href="/admin/products" className="label-bold text-[var(--color-primary)]">Go to Menu Manager</a>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
