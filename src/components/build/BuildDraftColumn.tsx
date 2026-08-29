import { Info, Layers, Loader2, Save, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { BuildDraftRow } from '@/components/build/BuildDraftRow'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/Button'
import type { IBuildEntry } from '@/models/build'

interface BuildDraftColumnProps {
  entries: IBuildEntry[]
  duplicateFlags: boolean[]
  /** The number that will actually be added — the plan's length. */
  additionCount: number
  /** Where the draft is going. Supplied by the page. */
  destination: ReactNode
  /** The duplicate notice, when there is one. */
  notice?: ReactNode
  canSave: boolean
  isSaving: boolean
  onDiscard: () => void
  onSave: () => void
}

/**
 * What has been gathered, where it is going, and the one control that commits
 * it.
 *
 * The column must read as **local and unsaved throughout**. Nothing here may
 * suggest a video has reached YouTube until a save has actually succeeded,
 * which is why the notice above the list says so in as many words rather than
 * relying on the word "draft" to carry it.
 */
export function BuildDraftColumn({
  entries,
  duplicateFlags,
  additionCount,
  destination,
  notice,
  canSave,
  isSaving,
  onDiscard,
  onSave,
}: BuildDraftColumnProps) {
  const { t } = useTranslation()

  return (
    <section
      aria-label={t('build.draft')}
      className="flex min-h-[22rem] min-w-0 flex-col rounded-xl border bg-card p-3 shadow-card sm:p-4">
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">{t('build.draft')}</h2>

      {destination}

      <div className="my-3 border-t" />

      {entries.length === 0 ? (
        <EmptyState icon={Layers} title={t('build.draftEmpty')} className="flex-1" />
      ) : (
        <>
          {/* Said plainly, not implied. The person is looking at a list of
              videos that are not yet anywhere. */}
          <p className="mb-2 inline-flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {t('build.draftNotice')}
          </p>

          <ul className="min-h-0 flex-1 list-none space-y-2 overflow-y-auto p-0">
            {entries.map((entry, index) => (
              <li key={entry.key}>
                <BuildDraftRow entry={entry} position={index + 1} isDuplicate={duplicateFlags[index] === true} />
              </li>
            ))}
          </ul>
        </>
      )}

      {notice && <div className="mt-3">{notice}</div>}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <span aria-live="polite" className="text-sm font-medium">
          {t('build.willAdd', { count: additionCount })}
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" disabled={entries.length === 0 || isSaving} onClick={onDiscard}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {t('build.discard.action')}
          </Button>

          <Button variant="brand" disabled={!canSave || isSaving} onClick={onSave}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-4 w-4" aria-hidden="true" />
            )}
            {t('build.save.action')}
          </Button>
        </div>
      </div>
    </section>
  )
}
