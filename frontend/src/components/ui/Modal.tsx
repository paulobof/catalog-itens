'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils/cn'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children?: React.ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = original
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        aria-hidden="true"
        onClick={onClose}
      />

      <div
        className={cn(
          'relative z-10 flex max-h-[85vh] flex-col rounded-t-3xl bg-white shadow-2xl animate-slide-up',
          className,
        )}
      >
        <div
          className="flex justify-center pt-3 pb-1 shrink-0"
          aria-hidden="true"
        >
          <div className="h-1 w-10 rounded-full bg-barbie-accent/40" />
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-barbie-bg-soft text-barbie-text/50 transition-colors hover:bg-barbie-accent/20 hover:text-barbie-primary"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        {title && (
          <h2 className="px-5 pt-1 pr-12 text-base font-bold text-barbie-text">
            {title}
          </h2>
        )}

        <div className="flex-1 overflow-y-auto overscroll-contain p-5">
          {children}
        </div>
      </div>
    </div>
  )
}
