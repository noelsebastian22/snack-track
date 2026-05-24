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
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="bg-[#151C2C] border border-[#1E293B] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl animate-in mb-16 md:mb-0">
        <div className="sticky top-0 bg-[#151C2C] border-b border-[#1E293B] px-5 py-4 flex justify-between items-center z-10 rounded-t-2xl">
          <h2 className="text-xl font-black uppercase text-white">{title}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#1E293B] transition-colors text-[#94A3B8] hover:text-white"
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
