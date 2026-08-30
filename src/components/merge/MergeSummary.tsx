import { CircleAlert, Gauge, Info, Layers, Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/Button'
import type { IMergeSummary } from '@/models/merge'
import type { IPlaylist } from '@/models/playlist'
import { cn } from '@/utils/cn'

interface MergeSummaryProps {
  summary: IMergeSummary
  removeDuplicates: boolean
  onRemoveDuplicatesChange: (value: boolean) => void
  /** Below two, merging is impossible and the reason is stated rather than implied. */
  playlistCount: number
  /** The destination choice and its fields, supplied by the page. */
  destinationChoice: ReactNode
  /** The chosen existing destination, if there is one. Named in what is said about it. */
  destinationPlaylist?: IPlaylist
  /** Its contents could not be read, which blocks the merge. */
  destinationReadFailed: boolean
  onRetryDestination: () => void
  onClearDestination: () => void
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
  removeDuplicates,
  onRemoveDuplicatesChange,
  playlistCount,
  destinationChoice,
  destinationPlaylist,
  destinationReadFailed,
  onRetryDestination,
  onClearDestination,
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

      {(summary.isCounting || summary.isDestinationCounting) && (
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

      {/* A destination that could not be read blocks the merge for the same
          reason a source does, and for a sharper one: an unknown destination
          means an unknown duplicate count, so every video already in it would
          be added a second time. Retrying it, or choosing a different playlist,
          are the two ways forward. */}
      {destinationReadFailed && destinationPlaylist && (
        <div
          role="alert"
          className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <p className="inline-flex items-start gap-2">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
            {t('merge.destinationReadFailed', { playlist: destinationPlaylist.title })}
          </p>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onRetryDestination}>
              {t('merge.retrySource')}
            </Button>

            <Button variant="ghost" onClick={onClearDestination}>
              {t('merge.clearDestination')}
            </Button>
          </div>
        </div>
      )}

      {/* The breakdown, then the one number that matters. Every figure comes
          from the single plan computation, so they cannot disagree with the
          confirmation or the progress total.
          
          While counting, the figures are dimmed as well as labelled: a number
          that is going to change should not look settled. */}
      <div
        aria-live="polite"
        className={cn('flex flex-col gap-1', (summary.isCounting || summary.isDestinationCounting) && 'opacity-60')}>
        <p className="flex items-baseline justify-between gap-3 text-sm text-muted-foreground">
          <span>{t('merge.playlistCount', { count: summary.playlistCount })}</span>
          <span className="tabular-nums">{t('merge.totalVideos', { count: summary.totalVideos })}</span>
        </p>

        {summary.unavailableCount > 0 && (
          <p className="text-sm text-muted-foreground">{t('merge.unavailable', { count: summary.unavailableCount })}</p>
        )}

        <p className="text-sm text-muted-foreground">
          {summary.duplicateCount > 0
            ? t('merge.duplicates', { count: summary.duplicateCount })
            : t('merge.duplicatesNone')}
        </p>

        {/* Said alongside the overall count rather than instead of it, so the
            fall in "will be added" has a visible cause. */}
        {summary.destinationDuplicateCount > 0 && destinationPlaylist && (
          <p className="text-sm text-muted-foreground">
            {t('merge.destinationDuplicates', {
              count: summary.destinationDuplicateCount,
              playlist: destinationPlaylist.title,
            })}
          </p>
        )}

        <p className="mt-1 text-lg font-semibold text-foreground">
          {t('merge.willAdd', { count: summary.willAddCount })}
        </p>

        {/* Newly reachable with a full draft: everything selected is already in
            the destination. That is an outcome, not an error — it must not read
            as a failure, and it must not leave the disabled control
            unexplained. */}
        {summary.willAddCount === 0 && !summary.isCounting && !summary.isDestinationCounting && destinationPlaylist && (
          <p className="text-sm text-muted-foreground">
            {t('merge.nothingToAdd', { playlist: destinationPlaylist.title })}
          </p>
        )}
      </div>

      {/* Sits with the count it governs. Defaulting to on is the whole reason
          most people merge; the polarity is the inverse of Copy's and Build's
          `includeDuplicates` and means the same thing — the wording follows the
          sentence this screen says, not the flag's name. */}
      {/* The input is **nested inside** the label, which associates the two on
          its own. It must NOT *also* carry `htmlFor`/`id`.
          
          With both associations, pressing Space toggles the checkbox natively
          and the resulting click reaches the label, whose activation behaviour
          forwards another click to the control it labels — so it toggles
          straight back and the key appears dead. A programmatic `.click()` does
          not reproduce it, which is what makes this easy to miss.
          
          Verified: with the tab genuinely focused, Space toggles a bare checkbox
          and did nothing here until the duplicate association was removed. */}
      <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
        <span>{t('merge.removeDuplicates')}</span>

        <input
          type="checkbox"
          checked={removeDuplicates}
          onChange={(event) => {
            onRemoveDuplicatesChange(event.target.checked)
          }}
          className="h-4 w-4 shrink-0 rounded border-input accent-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        />
      </label>

      {/* Always shown, and sharpened when the merge is large enough to matter
          to everyone else using this deployment. Never blocking: PlayPick
          cannot see the remaining allowance, so refusing would mean refusing on
          a guess. */}
      <p
        className={cn(
          'inline-flex items-start gap-2 rounded-lg border p-3 text-sm',
          summary.isLargeMerge ? 'border-destructive/30 bg-destructive/5' : 'bg-muted/40 text-muted-foreground',
        )}>
        <Gauge className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        {summary.isLargeMerge ? t('merge.costLarge') : t('merge.cost')}
      </p>

      {/* The one expectation a "merge" screen has to correct explicitly. */}
      <p className="inline-flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        {t('merge.keepsSources')}
      </p>

      {/* The whole decision sits in one column: what you get, then where it
          goes, then the control that commits it. */}
      <div className="border-t pt-4">{destinationChoice}</div>

      <Button variant="brand" className="w-full" disabled={!canMerge || isMerging} onClick={onMerge}>
        {isMerging && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {destinationPlaylist ? t('merge.actionExisting') : t('merge.action')}
      </Button>
    </section>
  )
}
