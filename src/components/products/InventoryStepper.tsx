'use client';

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { updateProductQty } from '@/app/actions/product-actions';

interface InventoryStepperProps {
  productId: string;
  initialQty: number;
  onUpdate: (newQty: number) => void;
}

export default function InventoryStepper({ productId, initialQty, onUpdate }: InventoryStepperProps) {
  const [qty, setQty] = useState(initialQty);

  const updateQty = async (newQty: number) => {
    if (newQty < 0) return;
    
    setQty(newQty);
    onUpdate(newQty);

    const res = await updateProductQty(productId, newQty);
    if ('error' in res && res.error) {
      console.error('Error updating inventory:', res.error);
      setQty(initialQty);
      onUpdate(initialQty);
      alert('Failed to update inventory. Please try again.');
    }
  };

  return (
    <div className="flex items-center gap-3 bg-[#0B0F19] border border-[#1E293B] rounded-xl px-3 py-2">
      <button 
        onClick={() => updateQty(qty - 1)}
        className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#151C2C] border border-[#1E293B] hover:border-[#00C853] transition-colors text-white"
      >
        <Minus size={18} strokeWidth={3} />
      </button>
      <span className="text-xl font-black min-w-[3ch] text-center text-white tabular-nums">{qty}</span>
      <button 
        onClick={() => updateQty(qty + 1)}
        className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#151C2C] border border-[#1E293B] hover:border-[#00C853] transition-colors text-white"
      >
        <Plus size={18} strokeWidth={3} />
      </button>
    </div>
  );
}
