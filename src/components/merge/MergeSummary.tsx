import { CircleAlert, Info, Layers, Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/Button'
import type { IMergeSummary } from '@/models/merge'
import { cn } from '@/utils/cn'

interface MergeSummaryProps {
  summary: IMergeSummary
  /** Below two, merging is impossible and the reason is stated rather than implied. */
  playlistCount: number
  /** The result fields, supplied by the page. */
  resultFields: ReactNode
  canMerge: boolean
  isMerging: boolean
  onRetrySource: (playlistId: string) => void
  onDeselectSource: (playlistId: string) => void
  onMerge: () => void
}

/**
 * What the selection adds up to, and the one control that commits it.
 *
 * Three states matter more than the numbers:
 *
 * **Still counting.** A total that is going to change is worse than no total if
 * it is presented as final, so it is labelled and merging waits.
 *
 * **A playlist that could not be read.** This *blocks* the merge rather than
 * warning about it. Merging on contents that are partly unknown would produce a
 * playlist silently missing videos the person selected — and PlayPick can
 * neither remove a video from a playlist nor delete one, so there would be no
 * way back. Retrying that playlist or dropping it from the selection are the two
 * ways forward, and both are offered.
 *
 * **The sources are kept.** Said in as many words, because "merge" reasonably
 * leads people to expect the originals to disappear, and nothing here can undo
 * that expectation after the fact.
 */
export function MergeSummary({
  summary,
  playlistCount,
  resultFields,
  canMerge,
  isMerging,
  onRetrySource,
  onDeselectSource,
  onMerge,
}: MergeSummaryProps) {
  const { t } = useTranslation()

  if (playlistCount < 2) {
    return (
      <section
        aria-label={t('merge.summary')}
        className="flex min-w-0 flex-col rounded-xl border bg-card p-4 shadow-card">
        <EmptyState icon={Layers} title={t('merge.selectAtLeastTwo')} className="py-8" />
      </section>
    )
  }

  return (
    <section
      aria-label={t('merge.summary')}
      className="flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-4 shadow-card">
      <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{t('merge.summary')}</h2>

      {summary.isCounting && (
        <p role="status" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
          <span>
            {t('merge.counting')} {t('merge.countingHint')}
          </span>
        </p>
      )}

      {/* Blocks, never merely warns — see the note above. */}
      {summary.failedSources.map((playlist) => (
        <div
          key={playlist.id}
          role="alert"
          className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <p className="inline-flex items-start gap-2">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
            {t('merge.readFailed', { playlist: playlist.title })}
          </p>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                onRetrySource(playlist.id)
              }}>
              {t('merge.retrySource')}
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                onDeselectSource(playlist.id)
              }}>
              {t('merge.deselectSource')}
            </Button>
          </div>
        </div>
      ))}

      {/* The breakdown, then the one number that matters. Every figure comes
          from the single plan computation, so they cannot disagree with the
          confirmation or the progress total.
          
          While counting, the figures are dimmed as well as labelled: a number
          that is going to change should not look settled. */}
      <div aria-live="polite" className={cn('flex flex-col gap-1', summary.isCounting && 'opacity-60')}>
        <p className="flex items-baseline justify-between gap-3 text-sm text-muted-foreground">
          <span>{t('merge.playlistCount', { count: summary.playlistCount })}</span>
          <span className="tabular-nums">{t('merge.totalVideos', { count: summary.totalVideos })}</span>
        </p>

        {summary.unavailableCount > 0 && (
          <p className="text-sm text-muted-foreground">{t('merge.unavailable', { count: summary.unavailableCount })}</p>
        )}

        <p className="mt-1 text-lg font-semibold text-foreground">
          {t('merge.willAdd', { count: summary.willAddCount })}
        </p>
      </div>

      {/* The one expectation a "merge" screen has to correct explicitly. */}
      <p className="inline-flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        {t('merge.keepsSources')}
      </p>

      <div className="border-t pt-4">{resultFields}</div>

      <Button variant="brand" className="w-full" disabled={!canMerge || isMerging} onClick={onMerge}>
        {isMerging && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {t('merge.action')}
      </Button>
    </section>
  )
}
