import { Loader2 } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'

interface ProgressDialogProps {
  open: boolean
  /** Moves confirmed applied. */
  completed: number
  /** Captured when Save was pressed, so it cannot move mid-run. */
  total: number
}

/**
 * Real progress through a save.
 *
 * A count of completed changes against the total, never an indefinite spinner:
 * a save is up to two hundred separate network mutations, and "please wait"
 * tells the person nothing about whether it is nearly done or barely started.
 *
 * Not dismissible while it runs — there is nothing useful to do with a
 * half-applied plan, and offering a close button would imply otherwise.
 */
export function ProgressDialog({ open, completed, total }: ProgressDialogProps) {
  const { t } = useTranslation()
  const titleId = useId()

  if (!open) return null

  const safeTotal = Math.max(total, 1)
  const percent = Math.round((Math.min(completed, safeTotal) / safeTotal) * 100)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40" aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-sm rounded-xl border bg-card p-5 shadow-elevated">
        <h2 id={titleId} className="flex items-center gap-2 text-base font-semibold">
          <Loader2 className="h-4 w-4 animate-spin text-brand" aria-hidden="true" />
          {t('progress.title')}
        </h2>

        <div
          // A real progressbar, so the value is announced rather than merely drawn.
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={completed}
          aria-valuetext={t('progress.step', { completed, total })}
          className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${String(percent)}%` }} />
        </div>

        <p className="mt-3 text-sm text-muted-foreground">{t('progress.step', { completed, total })}</p>
      </div>
    </div>
  )
}
