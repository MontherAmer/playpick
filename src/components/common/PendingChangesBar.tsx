import { Loader2, Save, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/Button'

interface PendingChangesBarProps {
  /** The count of pending changes. Zero renders nothing at all. */
  pendingCount: number
  /**
   * Extra context beside the count — Copy Between Playlists puts its duplicate
   * notice here. Omitted, the bar is exactly what it was.
   */
  secondary?: ReactNode
  onDiscard: () => void
  onSave: () => void
  isSaving: boolean
}

/**
 * What is waiting to be sent, and the two things you can do about it.
 *
 * Renders nothing when there is nothing pending: no bar, and — importantly — no
 * save control, so Save is never available to press when it would do nothing.
 *
 * The wording says the changes are *unsaved*. It must never read as though
 * YouTube has already been updated, because until Save succeeds it has not.
 */
export function PendingChangesBar({ pendingCount, secondary, onDiscard, onSave, isSaving }: PendingChangesBarProps) {
  const { t } = useTranslation()

  if (pendingCount === 0) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4">
      <div
        // Polite: the count changing is meaningful, but never urgent enough to
        // interrupt what a screen-reader user is currently reading.
        role="status"
        aria-live="polite"
        className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border bg-card p-3 shadow-elevated">
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand" />
          </span>
          {t('pending.title')}
        </span>

        <span className="rounded-full border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {t('pending.count', { count: pendingCount })}
        </span>

        {secondary}

        <div className="ms-auto flex items-center gap-2">
          <Button variant="ghost" onClick={onDiscard} disabled={isSaving}>
            <X className="h-4 w-4" aria-hidden="true" />
            {t('pending.discard')}
          </Button>

          <Button variant="brand" onClick={onSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-4 w-4" aria-hidden="true" />
            )}
            {t('pending.save')}
          </Button>
        </div>
      </div>
    </div>
  )
}
