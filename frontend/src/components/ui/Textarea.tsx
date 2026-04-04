'use client'

import { cn } from '@/lib/utils/cn'
import { forwardRef, type TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId =
      id ?? `textarea-${props.name ?? Math.random().toString(36).slice(2)}`
    const errorId = error ? `${inputId}-error` : undefined
    const hintId = hint ? `${inputId}-hint` : undefined

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-semibold text-barbie-text"
          >
            {label}
          </label>
        )}
        <textarea
          {...props}
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={
            [errorId, hintId].filter(Boolean).join(' ') || undefined
          }
          className={cn(
            'w-full resize-none rounded-xl border border-barbie-accent bg-white px-4 py-2.5 text-barbie-text placeholder:text-barbie-accent focus:border-barbie-primary focus:outline-none focus:ring-2 focus:ring-barbie-primary/30 disabled:cursor-not-allowed disabled:bg-barbie-bg-soft',
            error && 'border-red-400 focus:border-red-500 focus:ring-red-200',
            className,
          )}
        />
        {hint && !error && (
          <p id={hintId} className="text-xs text-barbie-text/60">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
