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
    
    // Optimistic UI update
    setQty(newQty);
    onUpdate(newQty);

    const res = await updateProductQty(productId, newQty);
    if ('error' in res && res.error) {
      console.error('Error updating inventory:', res.error);
      // Rollback on error
      setQty(initialQty);
      onUpdate(initialQty);
      alert('Failed to update inventory. Please try again.');
    }
  };

  return (
    <div className="flex items-center gap-4 bg-[var(--color-surface-container)] border-2 border-[var(--color-secondary)] rounded-[var(--radius-full)] px-4 py-2">
      <button 
        onClick={() => updateQty(qty - 1)}
        className="text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors"
      >
        <Minus size={20} strokeWidth={3} />
      </button>
      <span className="stat-display text-2xl min-w-[3ch] text-center">{qty}</span>
      <button 
        onClick={() => updateQty(qty + 1)}
        className="text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors"
      >
        <Plus size={20} strokeWidth={3} />
      </button>
    </div>
  );
}
