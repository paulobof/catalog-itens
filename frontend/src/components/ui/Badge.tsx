import { cn } from '@/lib/utils/cn'
import type { HTMLAttributes } from 'react'

type BadgeVariant = 'default' | 'primary' | 'dark' | 'custom'

interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'color'> {
  variant?: BadgeVariant
  color?: string | null
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-barbie-bg-soft text-barbie-text',
  primary: 'bg-barbie-primary text-white',
  dark: 'bg-barbie-dark text-white',
  custom: '',
}

export function Badge({
  variant = 'default',
  color,
  className,
  style,
  children,
  ...props
}: BadgeProps) {
  const customStyle =
    variant === 'custom' && color
      ? {
          backgroundColor: `${color}33`,
          color: color,
          borderColor: `${color}66`,
          ...style,
        }
      : style

  return (
    <span
      {...props}
      style={customStyle}
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        variantClasses[variant],
        variant === 'custom' && 'border',
        variant !== 'custom' && 'border-transparent',
        className,
      )}
    >
      {children}
    </span>
  )
}
