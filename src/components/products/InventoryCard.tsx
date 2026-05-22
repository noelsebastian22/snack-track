'use client';

import InventoryStepper from './InventoryStepper';

interface Product {
  id: string;
  name: string;
  qty_available: number;
  image_url: string;
}

interface InventoryCardProps {
  product: Product;
  onRefresh: () => void;
}

export default function InventoryCard({ product, onRefresh }: InventoryCardProps) {
  return (
    <div className="bg-white border-2 border-[var(--color-secondary)] rounded-[var(--radius-lg)] overflow-hidden shadow-[4px_4px_0px_#1A1C1C] flex flex-col">
      <div className="h-32 bg-[var(--color-surface-container)] relative overflow-hidden border-b-2 border-[var(--color-secondary)]">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--color-outline)] font-bold">STOCK</div>
        )}
      </div>
      
      <div className="p-4 flex flex-col items-center gap-3">
        <h3 className="label-bold text-center h-10 flex items-center">{product.name}</h3>
        <InventoryStepper 
          productId={product.id} 
          initialQty={product.qty_available} 
          onUpdate={onRefresh}
        />
      </div>
    </div>
  );
}
