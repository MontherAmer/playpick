import { Search, X } from 'lucide-react'
import { useId } from 'react'

import { cn } from '@/utils/cn'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  /** Already translated. Visually hidden — the placeholder carries the visible hint. */
  label: string
  placeholder: string
  /** Accessible name for the clear button, which has no visible text. */
  clearLabel: string
  className?: string
}

const INPUT_CLASSES =
  'h-10 w-full rounded-md border border-input bg-background ps-9 pe-9 text-sm placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/**
 * A text filter with a leading icon and a clear button.
 *
 * The label is real and merely hidden, rather than absent with a placeholder
 * standing in for it: a placeholder disappears on the first keystroke and is
 * not a reliable accessible name.
 *
 * Positioned entirely with logical properties (`ps`/`pe`/`start`/`end`), so the
 * icon and the clear button swap sides in Arabic without a second rule. The
 * magnifier is not mirrored — its meaning does not depend on direction.
 */
export function SearchInput({ value, onChange, label, placeholder, clearLabel, className }: SearchInputProps) {
  const inputId = useId()

  return (
    <div className={cn('relative', className)}>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>

      <Search
        aria-hidden="true"
        className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />

      <input
        id={inputId}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event.target.value)
        }}
        // Suppress WebKit's own clear widget; the button below is the one that
        // carries an accessible name and matches the design.
        className={cn(INPUT_CLASSES, '[&::-webkit-search-cancel-button]:appearance-none')}
      />

      {value !== '' && (
        <button
          type="button"
          aria-label={clearLabel}
          onClick={() => {
            onChange('')
          }}
          className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
