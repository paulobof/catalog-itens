import { cn } from '@/lib/utils/cn'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-4',
  lg: 'h-12 w-12 border-4',
}

export function Spinner({
  size = 'md',
  className,
  label = 'Carregando...',
}: SpinnerProps) {
  return (
    <div role="status" aria-label={label} className={cn('inline-flex', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-barbie-bg-soft border-t-barbie-primary',
          sizeClasses[size],
        )}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}
