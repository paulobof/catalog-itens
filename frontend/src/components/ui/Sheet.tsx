'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

interface SheetProps {
  children?: React.ReactNode
  className?: string
}

/**
 * Bottom sheet / slide-over modal.
 * Slides up from the bottom on mobile. Closes via router.back() so the
 * intercepting route is dismissed and the background page is restored.
 */
export function Sheet({ children, className }: SheetProps) {
  const router = useRouter()
  const sheetRef = useRef<HTMLDivElement>(null)

  function handleClose() {
    router.back()
  }

  // Close on Escape key
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Prevent body scroll while sheet is open
  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        aria-hidden="true"
        onClick={handleClose}
      />

      {/* Sheet panel */}
      <div
        ref={sheetRef}
        className={cn(
          'relative z-10 flex max-h-[85vh] flex-col rounded-t-3xl bg-white shadow-2xl',
          'animate-slide-up',
          className,
        )}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-3 pb-1 shrink-0"
          aria-hidden="true"
        >
          <div className="h-1 w-10 rounded-full bg-barbie-accent/40" />
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Fechar"
          className="absolute right-4 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-barbie-bg-soft text-barbie-text/50 transition-colors hover:bg-barbie-accent/20 hover:text-barbie-primary"
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

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  )
}
