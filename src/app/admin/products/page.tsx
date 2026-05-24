'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import ProductCard from '@/components/products/ProductCard';
import ProductForm from '@/components/products/ProductForm';
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
    <main className="min-h-screen bg-[#0B0F19]">
      <header className="sticky top-0 z-10 bg-[#151C2C]/80 backdrop-blur-md border-b border-[#1E293B] px-5 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-black uppercase text-white">Menu Manager</h1>
          <button 
            onClick={() => setShowForm(true)}
            className="w-10 h-10 rounded-xl bg-[#00C853] flex items-center justify-center text-white hover:bg-[#00A844] transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
      </header>

      <div className="p-5 space-y-5">
        {showForm && (
          <div className="bg-[#151C2C] rounded-2xl border border-[#1E293B] p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-black uppercase text-white">Add Product</h2>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-lg bg-[#0B0F19] border border-[#1E293B] flex items-center justify-center text-[#94A3B8] hover:text-white transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <ProductForm 
              onSuccess={() => {
                setShowForm(false);
                fetchProducts();
              }} 
              onCancel={() => setShowForm(false)} 
            />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-[#00C853] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
              {products.length} Items in Menu
            </h2>
            <div className="space-y-3">
              {products.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onRefresh={fetchProducts} 
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
