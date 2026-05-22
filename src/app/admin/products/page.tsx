'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import ProductCard from '@/components/products/ProductCard';
import ProductForm from '@/components/products/ProductForm';
import BottomNav from '@/components/layout/BottomNav';
import { Plus } from 'lucide-react';

const supabase = createClient();

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  is_active: boolean;
}

export default function ProductManagerPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <main className="min-h-screen pb-[var(--spacing-touch-target)]">
      {/* Header */}
      <header className="p-4 bg-white border-b-2 border-[var(--color-secondary)] sticky top-0 z-10">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <h1 className="headline-lg uppercase italic">Menu Manager</h1>
          <button 
            onClick={() => setShowForm(true)}
            className="w-12 h-12 bg-[var(--color-primary)] rounded-full border-2 border-[var(--color-secondary)] flex items-center justify-center text-white shadow-[2px_2px_0px_#1A1C1C]"
          >
            <Plus size={28} />
          </button>
        </div>
      </header>

      <div className="p-4 max-w-md mx-auto space-y-4">
        {showForm && (
          <ProductForm 
            onSuccess={() => {
              setShowForm(false);
              fetchProducts();
            }} 
            onCancel={() => setShowForm(false)} 
          />
        )}

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="label-bold text-[var(--color-outline)]">
              {products.length} Items in Menu
            </h2>
            {products.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onRefresh={fetchProducts} 
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
