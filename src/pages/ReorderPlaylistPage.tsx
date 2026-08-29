import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ArrowLeft, CheckCircle2, ExternalLink, ListVideo, Loader2, RotateCcw } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PendingChangesBar } from '@/components/common/PendingChangesBar'
import { PlaylistPicker } from '@/components/playlists/PlaylistPicker'
import { ProgressDialog } from '@/components/common/ProgressDialog'
import { Button } from '@/components/ui/Button'
import { buttonStyles } from '@/components/ui/buttonStyles'
import { SortableVideoCard } from '@/components/videos/SortableVideoCard'
import { usePlaylistSelection } from '@/features/playlists/usePlaylistSelection'
import { useReorderDraft } from '@/features/reorder/useReorderDraft'
import { useSaveOrder } from '@/features/reorder/useSaveOrder'
import type { YouTubeErrorCode } from '@/api/youtube/errors'
import type { IPlaylist } from '@/models/playlist'

/**
 * Failures that need save-specific wording. The shared `errors.youtube.*`
 * strings are written for retrieval — "your playlists could not be loaded",
 * "not allowed to read your playlists" — which reads as nonsense when it was a
 * save that failed. Everything else is phrased neutrally enough to reuse.
 */
const SAVE_SPECIFIC_ERRORS: readonly YouTubeErrorCode[] = [
  'quotaExceeded',
  'insufficientPermissions',
  'notFound',
  'unknown',
]

function playlistUrl(playlistId: string): string {
  return `https://www.youtube.com/playlist?list=${playlistId}`
}

interface ReorderEditorProps {
  playlist: IPlaylist
  onLeave: () => void
}

function ReorderEditor({ playlist, onLeave }: ReorderEditorProps) {
  const { t } = useTranslation()
  const { status, error, draft, loadProgress, pendingCount, movePlan, moveItem, discard, retry, commitSaved } =
    useReorderDraft(playlist.id)
  const save = useSaveOrder(playlist.id)

  const [confirming, setConfirming] = useState<'discard' | 'leave' | null>(null)

  const isSaving = save.status === 'saving'

  const isReady = status === 'ready'
  const ids = useMemo(() => draft.map((item) => item.id), [draft])

  const sensors = useSensors(
    // A small distance so a tap on the handle is not mistaken for a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const titleOf = useCallback(
    (id: string) => {
      const item = draft.find((candidate) => candidate.id === id)

      if (!item) return ''

      return item.title === '' ? t('playlist.untitledVideo') : item.title
    },
    [draft, t],
  )

  /** Announced in the interface language, not the library's built-in English. */
  const announcements: Announcements = useMemo(
    () => ({
      onDragStart: ({ active }) =>
        t('reorder.announce.pickedUp', {
          title: titleOf(String(active.id)),
          position: ids.indexOf(String(active.id)) + 1,
          total: ids.length,
        }),
      onDragOver: ({ active, over }) =>
        over
          ? t('reorder.announce.movedTo', {
              title: titleOf(String(active.id)),
              position: ids.indexOf(String(over.id)) + 1,
              total: ids.length,
            })
          : undefined,
      onDragEnd: ({ active, over }) =>
        over
          ? t('reorder.announce.dropped', {
              title: titleOf(String(active.id)),
              position: ids.indexOf(String(over.id)) + 1,
              total: ids.length,
            })
          : undefined,
      onDragCancel: ({ active }) =>
        t('reorder.announce.cancelled', {
          title: titleOf(String(active.id)),
          position: ids.indexOf(String(active.id)) + 1,
        }),
    }),
    [ids, t, titleOf],
  )

  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (!over || active.id === over.id) return

      moveItem(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)))
    },
    [ids, moveItem],
  )

  const handleSave = useCallback(() => {
    void save.save(movePlan, draft).then((succeeded) => {
      // Only on a clean run. A partial save must keep the draft and its
      // remaining plan, so a retry has something to work from.
      if (succeeded) commitSaved()
    })
  }, [save, movePlan, draft, commitSaved])

  const leave = useCallback(() => {
    if (pendingCount > 0) {
      setConfirming('leave')

      return
    }

    onLeave()
  }, [pendingCount, onLeave])

  if (save.status === 'succeeded') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-brand/30 bg-brand-muted/40 px-6 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10">
          <CheckCircle2 className="h-6 w-6 text-brand" aria-hidden="true" />
        </div>

        <p className="font-semibold">{t('success.updated')}</p>
        <p className="text-sm text-muted-foreground">{t('success.description')}</p>

        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <a
            href={playlistUrl(playlist.id)}
            target="_blank"
            rel="noreferrer"
            className={buttonStyles({ variant: 'brand' })}>
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            {t('common.openOnYouTube')}
          </a>

          <Button
            variant="outline"
            onClick={() => {
              save.reset()
              onLeave()
            }}>
            {t('reorder.back')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={pendingCount > 0 ? 'flex flex-col gap-4 pb-28' : 'flex flex-col gap-4'}>
      <div className="flex min-w-0 items-center gap-3">
        <Button variant="ghost" size="icon" onClick={leave} aria-label={t('reorder.back')}>
          {/* Mirrored in Arabic: a back arrow's meaning *is* directional. */}
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
        </Button>

        <div className="min-w-0">
          <h2 dir="auto" className="truncate text-lg font-semibold">
            {playlist.title}
          </h2>

          <p className="text-xs text-muted-foreground">
            {t('playlist.videoCount', { count: isReady ? draft.length : playlist.itemCount })}
          </p>
        </div>
      </div>

      {isReady && draft.length > 1 && (
        <p className="text-sm text-muted-foreground">
          {pendingCount > 0 ? t('reorder.save.estimate', { count: pendingCount }) : t('reorder.subtitle')}
        </p>
      )}

      {status === 'loading' && (
        <p role="status" className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {loadProgress
            ? t('reorder.loading', { retrieved: loadProgress.retrieved, total: loadProgress.total })
            : t('common.loading')}
        </p>
      )}

      {status === 'failed' && error !== null && <ErrorState code={error} onRetry={retry} />}

      {save.status === 'failed' && (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p className="font-semibold">
            {t('errors.reorder.partial', {
              completed: save.completed,
              total: save.total,
              failed: save.total - save.completed,
            })}
          </p>

          <p className="mt-1 text-muted-foreground">
            {save.failure !== null && SAVE_SPECIFIC_ERRORS.includes(save.failure)
              ? t(`reorder.save.${save.failure}`)
              : t(`errors.youtube.${String(save.failure)}`)}
          </p>

          {save.failure !== 'quotaExceeded' && save.failure !== 'apiNotEnabled' && (
            <Button
              variant="outline"
              className="mt-3"
              onClick={() => {
                void save.retry().then((succeeded) => {
                  if (succeeded) commitSaved()
                })
              }}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              {t('reorder.save.retry')}
            </Button>
          )}
        </div>
      )}

      {isReady && draft.length === 0 && <EmptyState icon={ListVideo} title={t('reorder.empty')} />}

      {isReady && draft.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          accessibility={{ announcements }}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <ol className="flex flex-col gap-2">
              {draft.map((item, index) => (
                <SortableVideoCard
                  key={item.id}
                  item={item}
                  position={index + 1}
                  isFirst={index === 0}
                  isLast={index === draft.length - 1}
                  disabled={isSaving}
                  onMoveUp={() => {
                    moveItem(index, index - 1)
                  }}
                  onMoveDown={() => {
                    moveItem(index, index + 1)
                  }}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}

      <PendingChangesBar
        pendingCount={pendingCount}
        onDiscard={() => {
          setConfirming('discard')
        }}
        onSave={handleSave}
        isSaving={isSaving}
      />

      <ProgressDialog open={isSaving} completed={save.completed} total={save.total} />

      <ConfirmDialog
        open={confirming === 'discard'}
        title={t('confirm.discard.title')}
        message={t('confirm.discard.message')}
        confirmLabel={t('confirm.discard.confirm')}
        onConfirm={() => {
          discard()
          setConfirming(null)
        }}
        onCancel={() => {
          setConfirming(null)
        }}
      />

      <ConfirmDialog
        open={confirming === 'leave'}
        title={t('confirm.leave.title')}
        message={t('confirm.leave.message')}
        confirmLabel={t('confirm.leave.confirm')}
        onConfirm={() => {
          setConfirming(null)
          onLeave()
        }}
        onCancel={() => {
          setConfirming(null)
        }}
      />
    </div>
  )
}

/**
 * Reorder Playlist: choose one of your playlists, then rearrange it.
 *
 * Deliberately thin — composition, not logic. The draft lives in
 * `useReorderDraft`, and selection reuses the surface feature 001 built for
 * exactly this, rather than a second tool-specific picker.
 */
export function ReorderPlaylistPage() {
  const { t } = useTranslation()
  const { selected, select, clear } = usePlaylistSelection()

  if (selected) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <ReorderEditor key={selected.id} playlist={selected} onLeave={clear} />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('reorder.title')}</h1>

        <p className="mt-1 text-sm text-muted-foreground sm:text-base">{t('reorder.selectFirst')}</p>
      </div>

      <PlaylistPicker onSelect={select} />
    </div>
  )
}
