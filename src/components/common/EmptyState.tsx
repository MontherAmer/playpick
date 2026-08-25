import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/utils/cn'

interface EmptyStateProps {
  icon: LucideIcon
  /** Already translated by the caller — this component holds no keys of its own. */
  title: string
  description?: string
  /** Rendered below the text; typically a button offering the way forward. */
  action?: ReactNode
  className?: string
}

/**
 * "There is nothing here, and that is not a failure."
 *
 * The dashed border is what separates it from an error: a deliberately quiet
 * placeholder rather than something demanding attention. `ErrorState` is the
 * component for a failure.
 */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center',
        className,
      )}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
      </div>

      <div className="max-w-sm">
        <p className="font-semibold">{title}</p>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>

      {action}
    </div>
  )
}
