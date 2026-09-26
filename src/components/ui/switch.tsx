import type { JSX } from 'react'

import { cn } from '@/lib/cn'

interface ISwitchProps {
  checked: boolean
  disabled?: boolean
  onCheckedChange: (checked: boolean) => void
  'aria-label'?: string
}

export function Switch({
  checked,
  disabled,
  onCheckedChange,
  'aria-label': ariaLabel,
}: ISwitchProps): JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative h-5 w-9 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-primary' : 'bg-input',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 size-4 rounded-full bg-background shadow transition-[inset-inline-start]',
          checked ? 'start-4' : 'start-0.5',
        )}
      />
    </button>
  )
}
