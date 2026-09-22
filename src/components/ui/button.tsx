import type { ButtonHTMLAttributes, JSX } from 'react'

import { cn } from '@/lib/cn'

type ButtonVariant = 'default' | 'ghost' | 'secondary'
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

interface IButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  default: 'h-9 px-4 py-2',
  sm: 'h-8 rounded-md px-3 text-xs',
  lg: 'h-12 rounded-md px-6 text-base',
  icon: 'h-9 w-9',
}

export function Button({
  className,
  variant = 'default',
  size = 'default',
  type = 'button',
  ...props
}: IButtonProps): JSX.Element {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    />
  )
}
