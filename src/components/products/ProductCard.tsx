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
    <div className="bg-white border-2 border-[var(--color-secondary)] rounded-[var(--radius-md)] overflow-hidden flex h-32">
      <div className="w-32 bg-[var(--color-surface-container)] flex-shrink-0 border-r-2 border-[var(--color-secondary)]">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--color-outline)] font-bold">NO IMG</div>
        )}
      </div>
      
      <div className="flex-grow p-3 flex flex-col justify-between">
        <div>
          <h3 className="body-lg leading-tight uppercase font-black">{product.name}</h3>
          <p className="stat-display text-2xl mt-1">${(product.price / 100).toFixed(2)}</p>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={toggleActive} className={`label-bold ${product.is_active ? 'text-[var(--color-success)]' : 'text-[var(--color-outline)]'}`}>
              {product.is_active ? 'Active' : 'Hidden'}
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={handleDelete} className="p-2 text-[var(--color-error)]">
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
