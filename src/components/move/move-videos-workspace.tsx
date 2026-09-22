import type { DragEvent, JSX } from 'react'

import { CheckSquare, CircleAlert, LoaderCircle, ShieldAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ContinueWithGoogleButton } from '@/components/auth/continue-with-google-button'
import {
  CopySuccess,
  DiscardDialog,
  DuplicateDialog,
  SaveDialog,
} from '@/components/copy/copy-dialogs'
import { PlaylistSelect } from '@/components/copy/playlist-select'
import { DestinationVideoList, SourceVideoList } from '@/components/copy/video-lists'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMoveVideos } from '@/features/move/use-move-videos'

export function MoveVideosWorkspace(): JSX.Element {
  const { t } = useTranslation()
  const move = useMoveVideos()

  if (!move.auth.isAuthenticated) {
    return (
      <section className="mx-auto max-w-lg rounded-lg border border-border bg-card p-8 text-center">
        <ShieldAlert className="mx-auto size-10 text-primary" />
        <h2 className="mt-4 font-display text-xl font-extrabold">{t('move.connect.title')}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t('move.connect.description')}
        </p>
        <ContinueWithGoogleButton
          label={t('auth.continue')}
          connectingLabel={t('auth.connecting')}
          isSigningIn={move.auth.status === 'signingIn'}
          onSignIn={() => void move.auth.signIn()}
          className="mx-auto mt-6"
        />
      </section>
    )
  }

  if (move.save.status === 'succeeded') {
    return (
      <CopySuccess
        count={move.save.completed}
        destinationId={move.destinationPlaylist?.id}
        onReset={move.handleResetAfterSuccess}
        translationPrefix="move"
      />
    )
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault()
    const videoId = event.dataTransfer.getData('text/plain')
    const video = move.sourceVideos.find((candidate) => candidate.videoId === videoId)

    if (video) move.handleAddVideos([video])
  }

  const canAdd =
    move.destinationState.status === 'ready' && move.selectedVideoIds.size > 0
  const allVisibleSelected =
    move.sourceVideos.length > 0 &&
    move.sourceVideos.every((video) => move.selectedVideoIds.has(video.videoId))

  return (
    <>
      <div className="mb-5 flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">
        <CircleAlert className="size-5 shrink-0" />
        <div>
          <b>{t('move.warning.title')}</b>
          <p className="mt-1 opacity-80">{t('move.warning.description')}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <PlaylistSelect
            label={t('move.sourcePlaylist')}
            value={move.sourcePlaylist?.id}
            playlists={move.playlists}
            excludedId={move.destinationPlaylist?.id}
            disabled={move.libraryState.status === 'loading'}
            onChange={move.handleSourcePlaylistChange}
          />
          <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
            <Button
              variant="ghost"
              size="sm"
              disabled={move.sourceVideos.length === 0}
              onClick={move.handleToggleAllVisible}
            >
              <CheckSquare />
              {t(allVisibleSelected ? 'move.deselectAll' : 'move.selectAll')}
            </Button>
            <span className="text-xs text-muted-foreground">
              {t('move.selectedCount', { count: move.selectedVideoIds.size })}
            </span>
            <Input
              value={move.sourceFilter}
              onChange={(event) => move.setSourceFilter(event.target.value)}
              placeholder={t('move.filter')}
              className="ms-auto w-36 sm:w-44"
            />
            <Button size="sm" disabled={!canAdd} onClick={move.handleAddSelected}>
              {t('move.addSelected')}
            </Button>
          </div>
          {move.sourceState.status === 'loading' || move.libraryState.status === 'loading' ? (
            <LoaderCircle className="mx-auto my-10 size-7 animate-spin text-primary" />
          ) : move.sourceState.error || move.libraryState.error ? (
            <p role="alert" className="p-6 text-sm text-destructive">
              {t(`errors.youtube.${move.sourceState.error ?? move.libraryState.error ?? 'unknown'}`)}
            </p>
          ) : (
            <div className="max-h-[520px] overflow-y-auto">
              <SourceVideoList
                videos={move.sourceVideos}
                selectedVideoIds={move.selectedVideoIds}
                disabled={move.destinationState.status !== 'ready'}
                onToggle={move.handleToggleVideo}
                onAdd={(video) => move.handleAddVideos([video])}
              />
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <PlaylistSelect
            label={t('move.destinationPlaylist')}
            value={move.destinationPlaylist?.id}
            playlists={move.playlists}
            excludedId={move.sourcePlaylist?.id}
            disabled={move.libraryState.status === 'loading'}
            onChange={move.handleDestinationPlaylistChange}
          />
          <div className="grid grid-cols-2 gap-2 border-b border-border p-4 sm:grid-cols-4">
            {[
              ['existing', move.destinationVideos.length],
              ['pending', move.pendingCount],
              ['duplicates', move.duplicateCount],
              ['total', move.destinationVideos.length + move.pendingCount],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md bg-muted p-2 text-center">
                <b className="block text-lg">{value}</b>
                <small className="text-muted-foreground">{t(`move.stats.${label}`)}</small>
              </div>
            ))}
          </div>
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            className="m-4 rounded-lg border border-dashed border-primary/40 bg-primary-soft/40 p-5 text-center text-sm text-muted-foreground"
          >
            {t('move.dropZone')}
          </div>
          {move.destinationState.status === 'loading' ? (
            <LoaderCircle className="mx-auto my-10 size-7 animate-spin text-primary" />
          ) : move.destinationState.error ? (
            <p role="alert" className="p-6 text-sm text-destructive">
              {t(`errors.youtube.${move.destinationState.error}`)}
            </p>
          ) : (
            <div className="max-h-[520px] overflow-y-auto">
              <DestinationVideoList
                existingVideos={move.destinationVideos}
                pending={move.pending}
                onRemovePending={move.handleRemovePending}
              />
            </div>
          )}
        </section>
      </div>

      {move.pending.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 shadow-2xl backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <span className="min-w-0 flex-1">
              <b className="block text-sm">{t('move.pendingChanges', { count: move.pendingCount })}</b>
              {move.duplicateCount > 0 ? (
                <small className="text-amber-700 dark:text-amber-300">
                  {t('move.duplicateCount', { count: move.duplicateCount })}
                </small>
              ) : null}
            </span>
            <Button variant="ghost" onClick={move.openDiscardDialog}>{t('common.cancel')}</Button>
            <Button disabled={move.pendingCount === 0} onClick={move.handleRequestSave}>
              {t('move.save')}
            </Button>
          </div>
        </div>
      ) : null}

      {move.isDiscardDialogOpen ? (
        <DiscardDialog
          onCancel={move.closeDiscardDialog}
          onConfirm={move.handleDiscard}
          translationPrefix="move"
        />
      ) : null}
      {move.isDuplicateDialogOpen ? (
        <DuplicateDialog
          count={move.duplicateCount}
          onCancel={move.closeDuplicateDialog}
          onConfirm={move.handleSaveAfterDuplicateChoice}
          translationPrefix="move"
        />
      ) : null}
      <SaveDialog
        progress={move.save}
        onRetry={() => void move.save.retry()}
        onClose={move.save.reset}
        translationPrefix="move"
      />
    </>
  )
}
