'use client'

import { ToastProvider } from '@/components/ui/ToastProvider'

export default function Providers({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>
}
