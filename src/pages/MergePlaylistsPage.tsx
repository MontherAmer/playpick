import { CheckCircle2, ExternalLink, RotateCcw } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ErrorState } from '@/components/common/ErrorState'
import { ProgressDialog } from '@/components/common/ProgressDialog'
import { MergeResultFields } from '@/components/merge/MergeResultFields'
import { MergeSourcePicker } from '@/components/merge/MergeSourcePicker'
import { MergeSummary } from '@/components/merge/MergeSummary'
import { Button } from '@/components/ui/Button'
import { buttonStyles } from '@/components/ui/buttonStyles'
import { LARGE_MERGE_THRESHOLD, buildMergePlan } from '@/features/merge/buildMergePlan'
import { useSelectedPlaylistItems } from '@/features/merge/useSelectedPlaylistItems'
import { isDraftSubmittable } from '@/features/create/validatePlaylistDraft'
import { useCreateAndFillPlaylist } from '@/features/playlists/useCreateAndFillPlaylist'
import type { YouTubeErrorCode } from '@/api/youtube/errors'
import type { IBuildDestination } from '@/models/build'
import type { IMergeSummary } from '@/models/merge'
import type { IPlaylist } from '@/models/playlist'
import { EMPTY_DRAFT, type IPlaylistDraft } from '@/models/playlistDraft'

function playlistUrl(playlistId: string): string {
  return `https://www.youtube.com/playlist?list=${playlistId}`
}

/**
 * Failures another attempt cannot fix: the day's allowance is spent, the account
 * holds all the playlists YouTube allows, or this deployment was never
 * configured to reach the API.
 */
const NO_RETRY: readonly YouTubeErrorCode[] = ['quotaExceeded', 'playlistLimitReached', 'apiNotEnabled']

/**
 * Merge Playlists: combine several playlists into one new one.
 *
 * Composition and wiring only. The picker owns selection, the retrieval hook
 * owns what is known about each playlist, the planner owns what will be added,
 * and the write is the shared create-and-fill hook's — the same one Build uses,
 * which is why a retry here cannot create a second playlist either.
 */
export function MergePlaylistsPage() {
  const { t } = useTranslation()

  const [selected, setSelected] = useState<IPlaylist[]>([])
  const [result, setResult] = useState<IPlaylistDraft>(EMPTY_DRAFT)
  const [isConfirming, setIsConfirming] = useState(false)
  /** On by default: de-duplicating is the main reason people merge at all. */
  const [removeDuplicates, setRemoveDuplicates] = useState(true)

  const { sources, retry } = useSelectedPlaylistItems(selected)
  const save = useCreateAndFillPlaylist()

  const plan = useMemo(() => buildMergePlan(sources, removeDuplicates), [sources, removeDuplicates])

  const summary = useMemo<IMergeSummary>(
    () => ({
      playlistCount: selected.length,
      totalVideos: plan.totalVideos,
      duplicateCount: plan.duplicateCount,
      unavailableCount: plan.unavailableCount,
      willAddCount: plan.steps.length,
      isCounting: sources.some((source) => source.status === 'pending' || source.status === 'reading'),
      failedSources: sources.filter((source) => source.status === 'failed').map((source) => source.playlist),
      isLargeMerge: plan.steps.length >= LARGE_MERGE_THRESHOLD,
    }),
    [selected.length, plan, sources],
  )

  const destination = useMemo<IBuildDestination>(() => ({ kind: 'new', draft: result }), [result])

  const isMerging = save.status === 'creating' || save.status === 'adding'

  /**
   * Every condition, not just the obvious ones. `failedSources` blocking is the
   * one that prevents a silently short merge.
   */
  const canMerge =
    selected.length >= 2 &&
    summary.failedSources.length === 0 &&
    !summary.isCounting &&
    summary.willAddCount > 0 &&
    isDraftSubmittable(result)

  const toggle = useCallback((playlist: IPlaylist) => {
    setSelected((current) =>
      current.some((candidate) => candidate.id === playlist.id)
        ? current.filter((candidate) => candidate.id !== playlist.id)
        : [...current, playlist],
    )
  }, [])

  const deselect = useCallback((playlistId: string) => {
    setSelected((current) => current.filter((candidate) => candidate.id !== playlistId))
  }, [])

  const startOver = useCallback(() => {
    save.reset()
    setSelected([])
    setResult(EMPTY_DRAFT)
  }, [save])

  if (save.status === 'succeeded' && save.targetPlaylist) {
    const target = save.targetPlaylist

    return (
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-brand/30 bg-brand-muted/40 px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10">
            <CheckCircle2 className="h-6 w-6 text-brand" aria-hidden="true" />
          </div>

          <p className="font-semibold">{t('merge.success.title')}</p>

          <p dir="auto" className="max-w-md text-sm text-muted-foreground">
            {t('merge.success.description', { count: save.completed, playlist: target.title })}
          </p>

          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <a
              href={playlistUrl(target.id)}
              target="_blank"
              rel="noreferrer"
              className={buttonStyles({ variant: 'brand' })}>
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              {t('common.openOnYouTube')}
            </a>

            <Button variant="outline" onClick={startOver}>
              {t('merge.success.another')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('merge.title')}</h1>

        <p className="mt-1 text-sm text-muted-foreground sm:text-base">{t('merge.subtitle')}</p>
      </div>

      {save.status === 'failed' && save.failure !== null && (
        <div className="mb-6 flex flex-col gap-2">
          {/* No `onRetry` here: ErrorState's control reads "Try again", which
              could be taken to mean redoing the whole merge. The
              remainder-only wording is rendered separately, below. */}
          <ErrorState code={save.failure} messageKey={`merge.save.${save.failure}`} />

          {/* What actually happened, stated apart from why it stopped: a run
              that added six of nine is not a failed run. */}
          {save.failedDuring === 'add' && (
            <p role="status" className="text-center text-sm text-muted-foreground">
              {t('merge.save.partial', {
                // `count` drives the plural; the other two are the text.
                count: save.completed,
                completed: save.completed,
                total: save.total,
              })}
            </p>
          )}

          {/* The playlist exists. Saying so is what stops someone merging again
              and ending up with two playlists they cannot delete. */}
          {save.failedDuring === 'add' && save.createdPlaylist && (
            <p role="status" className="text-center text-sm text-muted-foreground">
              {t('merge.save.createdButIncomplete', { playlist: save.createdPlaylist.title })}
            </p>
          )}

          {!NO_RETRY.includes(save.failure) && save.remaining.length > 0 && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  void save.retry()
                }}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                {t('merge.save.retry')}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* `minmax(0, …)` on both tracks, not bare widths: a grid item defaults to
          `min-width: auto`, so an intrinsically wide child would widen its track
          and scroll the whole page sideways at 320px. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <MergeSourcePicker selectedIds={new Set(selected.map((playlist) => playlist.id))} onToggle={toggle} />

        <MergeSummary
          summary={summary}
          removeDuplicates={removeDuplicates}
          onRemoveDuplicatesChange={setRemoveDuplicates}
          playlistCount={selected.length}
          resultFields={<MergeResultFields draft={result} onChange={setResult} disabled={isMerging} />}
          canMerge={canMerge}
          isMerging={isMerging}
          onRetrySource={retry}
          onDeselectSource={deselect}
          onMerge={() => {
            setIsConfirming(true)
          }}
        />
      </div>

      {/* Opened only while videos are being added: during creation there is
          nothing to count, and "0 of 40" reads as a stalled merge. */}
      <ProgressDialog open={save.status === 'adding'} completed={save.completed} total={save.total} />

      {/* Nothing is sent until this is accepted. */}
      <ConfirmDialog
        open={isConfirming}
        title={t('merge.confirm.title', { count: summary.willAddCount, playlist: result.title.trim() })}
        message={`${t('merge.keepsSources')} ${summary.isLargeMerge ? t('merge.costLarge') : t('merge.cost')}`}
        confirmLabel={t('merge.confirm.action')}
        onCancel={() => {
          setIsConfirming(false)
        }}
        onConfirm={() => {
          setIsConfirming(false)
          void save.save(plan.steps, destination)
        }}
      />
    </div>
  )
}
