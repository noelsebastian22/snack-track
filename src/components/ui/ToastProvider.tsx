'use client'

import { createContext, useContext, useState, useCallback } from 'react'

interface ToastMessage {
  id: string
  type: 'success' | 'error'
  message: string
}

interface ToastContextValue {
  showToast: (type: 'success' | 'error', message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-5 py-3 rounded-xl border shadow-xl backdrop-blur-sm animate-in slide-in-from-right duration-300 ${
              toast.type === 'success'
                ? 'bg-[#00C853]/15 border-[#00C853]/30 text-[#00C853]'
                : 'bg-[#EF4444]/15 border-[#EF4444]/30 text-[#EF4444]'
            }`}
          >
            {toast.type === 'success' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            )}
            <span className="text-sm font-bold">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
