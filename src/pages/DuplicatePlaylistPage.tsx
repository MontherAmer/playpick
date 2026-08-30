import { CheckCircle2, ExternalLink, Loader2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ErrorState } from '@/components/common/ErrorState'
import { ProgressDialog } from '@/components/common/ProgressDialog'
import { NewPlaylistFieldset } from '@/components/create/NewPlaylistFieldset'
import { DuplicateReviewList } from '@/components/duplicate/DuplicateReviewList'
import { DuplicateSourceSummary } from '@/components/duplicate/DuplicateSourceSummary'
import { PlaylistPicker } from '@/components/playlists/PlaylistPicker'
import { Button } from '@/components/ui/Button'
import { buttonStyles } from '@/components/ui/buttonStyles'
import { isDraftSubmittable } from '@/features/create/validatePlaylistDraft'
import { useDuplicateSource } from '@/features/duplicate/useDuplicateSource'
import { useCreateAndFillPlaylist } from '@/features/playlists/useCreateAndFillPlaylist'
import type { IBuildDestination } from '@/models/build'
import type { IPlaylist } from '@/models/playlist'
import { EMPTY_DRAFT, type IPlaylistDraft } from '@/models/playlistDraft'

function playlistUrl(playlistId: string): string {
  return `https://www.youtube.com/playlist?list=${playlistId}`
}

/**
 * Duplicate Playlist: one source in, one faithful copy out.
 *
 * ## The two properties this page exists to hold
 *
 * **Every repeat survives.** `buildDuplicatePlan` keeps them — this page's only
 * duty is not to filter them back out on the way past. A playlist holding a
 * video three times produces a copy holding it three times.
 *
 * **The source is read and never written to.** Every write here is addressed to
 * the playlist `useCreateAndFillPlaylist` has just created. Nothing on this page
 * can reach the source with a mutation, because nothing on this page issues one.
 *
 * ## What this page does not contain
 *
 * No write code. `useCreateAndFillPlaylist` creates once, adds sequentially,
 * keeps completed work, resumes only the remainder, refuses a second run
 * mid-flight, and adds the result to the shared library — all of it built for
 * Build and reused unchanged for the third time here.
 *
 * No draft state either: the order being copied is the source's, and this tool
 * never lets anyone change it.
 */
export function DuplicatePlaylistPage() {
  const { t } = useTranslation()

  const [source, setSource] = useState<IPlaylist | undefined>(undefined)
  const [draft, setDraft] = useState<IPlaylistDraft>(EMPTY_DRAFT)
  const [isConfirming, setIsConfirming] = useState(false)

  const { status, items, plan, summary } = useDuplicateSource(source)
  const save = useCreateAndFillPlaylist()

  const isDuplicating = save.status === 'creating' || save.status === 'adding'

  const destination = useMemo<IBuildDestination>(() => ({ kind: 'new', draft }), [draft])

  /**
   * Every condition, not just the obvious ones.
   *
   * `status !== 'ready'` is the one that prevents a silently short copy: a
   * partially retrieved playlist would plan from whatever had arrived, and
   * PlayPick can neither delete a playlist nor remove a video from one.
   *
   * `isDraftSubmittable` is where the no-default-visibility rule is enforced
   * structurally rather than by discipline — it is the same validator Create,
   * Build and Merge use, and it refuses a draft whose privacy is still unmade.
   */
  const canDuplicate =
    source !== undefined &&
    status === 'ready' &&
    summary.copyableCount > 0 &&
    isDraftSubmittable(draft) &&
    !isDuplicating

  /**
   * Choosing a source suggests a name and a description from it, **once**.
   *
   * A suggestion, visible and editable — not the design's silent substitution of
   * a title at submission time, which feature 005 rejected because PlayPick can
   * neither rename nor delete a playlist.
   *
   * Anything already typed is left alone: comparing two playlists before
   * deciding must not silently retype the name someone has chosen. Visibility is
   * **never** suggested — see `canDuplicate`.
   */
  const chooseSource = useCallback(
    (playlist: IPlaylist) => {
      setSource(playlist)
      setDraft((current) => ({
        ...current,
        title: current.title === '' ? t('duplicate.namePlaceholder', { name: playlist.title }) : current.title,
        description: current.description === '' ? (playlist.description ?? '') : current.description,
      }))
    },
    [t],
  )

  const startOver = useCallback(() => {
    save.reset()
    setSource(undefined)
    setDraft(EMPTY_DRAFT)
  }, [save])

  if (save.status === 'succeeded' && save.targetPlaylist) {
    const target = save.targetPlaylist

    return (
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-brand/30 bg-brand-muted/40 px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10">
            <CheckCircle2 className="h-6 w-6 text-brand" aria-hidden="true" />
          </div>

          <p className="font-semibold">{t('duplicate.success.title')}</p>

          <p dir="auto" className="max-w-md text-sm text-muted-foreground">
            {t('duplicate.success.description', { count: save.completed, playlist: target.title })}
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
              {t('duplicate.success.another')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('duplicate.title')}</h1>

        <p className="mt-1 text-sm text-muted-foreground sm:text-base">{t('duplicate.subtitle')}</p>
      </div>

      {save.status === 'failed' && save.failure !== null && (
        <div className="mb-4 flex flex-col gap-2">
          <ErrorState code={save.failure} messageKey={`duplicate.save.${save.failure}`} />
        </div>
      )}

      {source === undefined ? (
        <PlaylistPicker onSelect={chooseSource} label={t('duplicate.choose')} />
      ) : (
        <div className="flex flex-col gap-6">
          <DuplicateSourceSummary
            source={source}
            summary={summary}
            onChangeSource={() => {
              setSource(undefined)
            }}
            disabled={isDuplicating}
          />

          <NewPlaylistFieldset draft={draft} onChange={setDraft} namespace="duplicate" disabled={isDuplicating} />

          <DuplicateReviewList items={items} />

          <Button
            variant="brand"
            className="w-full"
            disabled={!canDuplicate}
            onClick={() => {
              setIsConfirming(true)
            }}>
            {isDuplicating && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {t('duplicate.action')}
          </Button>
        </div>
      )}

      {/* Opened only while videos are being added: during creation there is
          nothing to count, and "0 of 40" reads as a stalled run. */}
      <ProgressDialog open={save.status === 'adding'} completed={save.completed} total={save.total} />

      {/* Nothing is sent until this is accepted. */}
      <ConfirmDialog
        open={isConfirming}
        title={t('duplicate.confirm.title', {
          count: summary.copyableCount,
          playlist: draft.title.trim(),
        })}
        message={`${source ? t('duplicate.keepsSource', { playlist: source.title }) : ''} ${
          summary.isLargeDuplicate ? t('duplicate.costLarge') : t('duplicate.cost')
        }`}
        confirmLabel={t('duplicate.confirm.action')}
        onCancel={() => {
          setIsConfirming(false)
        }}
        onConfirm={() => {
          setIsConfirming(false)
          void save.save(plan, destination)
        }}
      />
    </div>
  )
}
