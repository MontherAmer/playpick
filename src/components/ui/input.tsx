import type { InputHTMLAttributes, JSX } from 'react'

import { cn } from '@/lib/cn'

export function Input({
  className,
  type = 'text',
  ...props
}: InputHTMLAttributes<HTMLInputElement>): JSX.Element {
  return (
    <input
      type={type}
      className={cn(
        'h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
