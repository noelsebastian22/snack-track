'use client';

import { Trash2 } from 'lucide-react';
import { toggleProductActive, deleteProduct as deleteProductAction } from '@/app/actions/product-actions';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  is_active: boolean;
}

interface ProductCardProps {
  product: Product;
  onRefresh: () => void;
}

export default function ProductCard({ product, onRefresh }: ProductCardProps) {
  const toggleActive = async () => {
    const res = await toggleProductActive(product.id);
    if ('error' in res && res.error) console.error('Error updating status:', res.error);
    onRefresh();
  };

  const handleDelete = async () => {
    if (!confirm('Delete this product?')) return;
    
    const res = await deleteProductAction(product.id);
    if ('error' in res && res.error) console.error('Error deleting product:', res.error);
    onRefresh();
  };

  return (
    <div className="bg-[#151C2C] border border-[#1E293B] rounded-2xl overflow-hidden flex h-32 shadow-xl">
      <div className="w-32 bg-[#0B0F19] flex-shrink-0">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#94A3B8] font-bold">NO IMG</div>
        )}
      </div>
      
      <div className="flex-grow p-3 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-black uppercase text-white leading-tight">{product.name}</h3>
          <p className="text-2xl font-black mt-1 text-[#00C853]">${(product.price / 100).toFixed(2)}</p>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={toggleActive} className={`text-sm font-bold ${product.is_active ? 'text-[#00C853]' : 'text-[#94A3B8]'}`}>
              {product.is_active ? 'Active' : 'Hidden'}
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={handleDelete} className="p-2 text-[#EF4444] hover:bg-red-500/10 rounded-lg transition-colors">
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
