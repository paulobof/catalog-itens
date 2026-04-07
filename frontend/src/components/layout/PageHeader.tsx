'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

interface PageHeaderProps {
  title: string
  backHref?: string
  backLabel?: string
  useBrowserBack?: boolean
  actions?: React.ReactNode
  className?: string
}

function BackArrowIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  )
}

export function PageHeader({
  title,
  backHref,
  backLabel = 'Voltar',
  useBrowserBack,
  actions,
  className,
}: PageHeaderProps) {
  const router = useRouter()
  void useBrowserBack

  function handleBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    if (backHref) {
      router.push(backHref)
    }
  }

  const showBack = backHref !== undefined || useBrowserBack === true

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex items-center gap-3 border-b border-barbie-accent/20 bg-barbie-surface/95 px-4 py-3 backdrop-blur-sm',
        className,
      )}
    >
      {showBack && (
        <button
          type="button"
          onClick={handleBack}
          aria-label={backLabel}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-barbie-dark transition-colors hover:bg-barbie-bg-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-barbie-primary focus-visible:outline-offset-2"
        >
          <BackArrowIcon />
        </button>
      )}
      <h1 className="flex-1 truncate text-lg font-bold text-barbie-text">
        {title}
      </h1>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
