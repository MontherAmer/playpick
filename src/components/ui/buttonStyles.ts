import { cn } from '@/utils/cn'

export type ButtonVariant = 'brand' | 'outline' | 'ghost'
export type ButtonSize = 'md' | 'lg' | 'icon'

const BASE_CLASSES =
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50'

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  brand: 'bg-brand text-brand-foreground shadow-brand-glow hover:bg-brand/90',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  md: 'h-10 px-4 py-2',
  lg: 'h-11 px-8',
  icon: 'h-10 w-10',
}

export interface ButtonStyleOptions {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

/**
 * Shared button classes, so anchors and buttons can look identical without
 * needing a polymorphic `asChild` component.
 */
export function buttonStyles({ variant = 'outline', size = 'md', className }: ButtonStyleOptions = {}): string {
  return cn(BASE_CLASSES, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className)
}
