'use client'

import { useEffect, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils/cn'

export type ToastVariant = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: string
  message: string
  variant: ToastVariant
}

const variantClasses: Record<ToastVariant, string> = {
  success: 'bg-green-50 border-green-400 text-green-800',
  error: 'bg-red-50 border-red-400 text-red-800',
  info: 'bg-barbie-bg-soft border-barbie-accent text-barbie-text',
}

const variantIcons: Record<ToastVariant, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
}

interface ToastItemProps {
  toast: ToastMessage
  onDismiss: (id: string) => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 shadow-card text-sm font-medium',
        variantClasses[toast.variant],
      )}
    >
      <span aria-hidden="true" className="text-base font-bold">
        {variantIcons[toast.variant]}
      </span>
      <span>{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Fechar notificação"
        className="ml-auto opacity-60 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  )
}

type ToastListener = (toasts: ToastMessage[]) => void
const listeners: Set<ToastListener> = new Set()
let toastQueue: ToastMessage[] = []

export function showToast(message: string, variant: ToastVariant = 'info'): void {
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
  toastQueue = [...toastQueue, { id, message, variant }]
  listeners.forEach((fn) => fn(toastQueue))
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const listener: ToastListener = (updated) => setToasts([...updated])
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  const dismiss = useCallback((id: string) => {
    toastQueue = toastQueue.filter((t) => t.id !== id)
    listeners.forEach((fn) => fn(toastQueue))
  }, [])

  if (!mounted) return null

  const container = document.getElementById('toast-root')
  if (!container) return null

  return createPortal(
    <>
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </>,
    container,
  )
}
