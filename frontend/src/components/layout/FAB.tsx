'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

interface FABProps {
  href: string
  label: string
  className?: string
}

function PlusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  )
}

export function FAB({ href, label, className }: FABProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        'fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-xl bg-barbie-gradient text-white shadow-fab transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-barbie-primary focus-visible:ring-offset-2',
        className,
      )}
    >
      <PlusIcon />
      <span className="sr-only">{label}</span>
    </Link>
  )
}
