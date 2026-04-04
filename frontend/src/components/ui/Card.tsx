import { cn } from '@/lib/utils/cn'
import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
}

export function Card({
  interactive = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      {...props}
      className={cn(
        'rounded-2xl bg-barbie-surface shadow-card',
        interactive &&
          'cursor-pointer transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0',
        className,
      )}
    >
      {children}
    </div>
  )
}

type CardBodyProps = HTMLAttributes<HTMLDivElement>

export function CardBody({ className, children, ...props }: CardBodyProps) {
  return (
    <div {...props} className={cn('p-4', className)}>
      {children}
    </div>
  )
}
