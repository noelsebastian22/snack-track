'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Dialog({ open, onClose, title, children }: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="bg-white border-2 border-secondary rounded-bento w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-[8px_8px_0px_#1A1C1C] animate-in">
        <div className="sticky top-0 bg-white border-b-2 border-secondary px-5 py-4 flex justify-between items-center z-10 rounded-t-[22px]">
          <h2 className="text-xl font-black uppercase">{title}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
            aria-label="Close dialog"
          >
            <X size={22} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
