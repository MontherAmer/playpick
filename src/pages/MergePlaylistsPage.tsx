import { CheckCircle2, ExternalLink, RotateCcw } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ErrorState } from '@/components/common/ErrorState'
import { ProgressDialog } from '@/components/common/ProgressDialog'
import { MergeSourcePicker } from '@/components/merge/MergeSourcePicker'
import { MergeSummary } from '@/components/merge/MergeSummary'
import { Button } from '@/components/ui/Button'
import { buttonStyles } from '@/components/ui/buttonStyles'
import { MergeDestinationChoice, type MergeDestinationKind } from '@/components/merge/MergeDestinationChoice'
import { useMergeDraft } from '@/features/merge/useMergeDraft'
import { useSelectedPlaylistItems } from '@/features/merge/useSelectedPlaylistItems'
import { isDraftSubmittable } from '@/features/create/validatePlaylistDraft'
import { useCreateAndFillPlaylist } from '@/features/playlists/useCreateAndFillPlaylist'
import type { YouTubeErrorCode } from '@/api/youtube/errors'
import type { IBuildDestination } from '@/models/build'
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
  const [destinationKind, setDestinationKind] = useState<MergeDestinationKind>('new')
  const [destinationPlaylist, setDestinationPlaylist] = useState<IPlaylist | undefined>(undefined)

  /**
   * The destination rides along on the sources' read rather than getting a hook
   * of its own, **deduplicated**.
   *
   * A second `useSelectedPlaylistItems` would carry its own memo, so a playlist
   * that is both a source and the destination — which is explicitly allowed —
   * would be read **twice**. Deduplicating the input list makes that impossible
   * rather than merely unlikely.
   */
  const readTargets = useMemo(() => {
    if (destinationKind !== 'existing' || !destinationPlaylist) return selected
    if (selected.some((playlist) => playlist.id === destinationPlaylist.id)) return selected

    return [...selected, destinationPlaylist]
  }, [selected, destinationKind, destinationPlaylist])

  const { sources: readSources, retry } = useSelectedPlaylistItems(readTargets)
  const save = useCreateAndFillPlaylist()

  /** Only the selected playlists are sources; the destination is not merged from. */
  const sources = useMemo(
    () => readSources.filter((source) => selected.some((playlist) => playlist.id === source.playlist.id)),
    [readSources, selected],
  )

  const destinationSource = useMemo(
    () =>
      destinationKind === 'existing' && destinationPlaylist
        ? readSources.find((source) => source.playlist.id === destinationPlaylist.id)
        : undefined,
    [readSources, destinationKind, destinationPlaylist],
  )

  /**
   * `null` means *unknown*, which blocks the merge; an empty set means *known to
   * hold nothing that matters*. A new playlist is the latter — it holds nothing
   * because it does not exist yet.
   */
  const destinationVideoIds = useMemo<ReadonlySet<string> | null>(() => {
    if (destinationKind === 'new') return new Set<string>()
    if (!destinationSource || destinationSource.status !== 'read') return null

    return new Set(destinationSource.items.map((item) => item.videoId))
  }, [destinationKind, destinationSource])

  const draft = useMergeDraft(sources, destinationVideoIds, removeDuplicates)
  const { summary } = draft

  const destinationReadFailed = destinationSource?.status === 'failed'

  const destination = useMemo<IBuildDestination>(
    () =>
      destinationKind === 'existing' && destinationPlaylist
        ? { kind: 'existing', playlist: destinationPlaylist }
        : { kind: 'new', draft: result },
    [destinationKind, destinationPlaylist, result],
  )

  const isMerging = save.status === 'creating' || save.status === 'adding'

  /**
   * Every condition, not just the obvious ones. `failedSources` blocking is the
   * one that prevents a silently short merge.
   */
  const canMerge =
    selected.length >= 2 &&
    summary.failedSources.length === 0 &&
    !summary.isCounting &&
    // An unknown destination means an unknown duplicate count, so merging into
    // one would add videos that are already there — and PlayPick can remove
    // neither them nor the playlist.
    !summary.isDestinationCounting &&
    !destinationReadFailed &&
    summary.willAddCount > 0 &&
    (destinationKind === 'existing' ? destinationPlaylist !== undefined : isDraftSubmittable(result))

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
    setDestinationKind('new')
    setDestinationPlaylist(undefined)
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
          destinationChoice={
            <MergeDestinationChoice
              kind={destinationKind}
              onKindChange={setDestinationKind}
              existing={destinationPlaylist}
              onExistingChange={setDestinationPlaylist}
              result={result}
              onResultChange={setResult}
              disabled={isMerging}
            />
          }
          destinationPlaylist={destinationKind === 'existing' ? destinationPlaylist : undefined}
          destinationReadFailed={destinationReadFailed}
          onRetryDestination={() => {
            if (destinationPlaylist) retry(destinationPlaylist.id)
          }}
          onClearDestination={() => {
            setDestinationPlaylist(undefined)
          }}
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
        /* Says which of the two things is about to happen. Claiming to create a
           playlist that already exists would be the defect feature 006 hit. */
        title={
          destinationKind === 'existing' && destinationPlaylist
            ? t('merge.confirm.existing', {
                count: summary.willAddCount,
                playlist: destinationPlaylist.title,
              })
            : t('merge.confirm.title', {
                count: summary.willAddCount,
                playlist: result.title.trim(),
              })
        }
        message={`${t('merge.keepsSources')} ${summary.isLargeMerge ? t('merge.costLarge') : t('merge.cost')}`}
        confirmLabel={destinationKind === 'existing' ? t('merge.confirm.actionExisting') : t('merge.confirm.action')}
        onCancel={() => {
          setIsConfirming(false)
        }}
        onConfirm={() => {
          setIsConfirming(false)
          void save.save(draft.plan, destination)
        }}
      />
    </div>
  )
}
