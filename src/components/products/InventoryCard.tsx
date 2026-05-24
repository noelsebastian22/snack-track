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
    <div className="bg-[#151C2C] rounded-2xl border border-[#1E293B] overflow-hidden shadow-xl flex flex-col">
      <div className="h-32 bg-[#0B0F19] relative overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#94A3B8] font-bold">STOCK</div>
        )}
      </div>
      
      <div className="p-4 flex flex-col items-center gap-3">
        <h3 className="text-sm font-bold uppercase text-center text-white h-10 flex items-center">{product.name}</h3>
        <InventoryStepper 
          productId={product.id} 
          initialQty={product.qty_available} 
          onUpdate={onRefresh}
        />
      </div>
    </div>
  );
}
