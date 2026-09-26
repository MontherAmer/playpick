import type { DragEvent, JSX } from 'react'

import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  CalendarDays,
  GripVertical,
  Image,
  LoaderCircle,
  Shuffle,
  ShieldAlert,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ContinueWithGoogleButton } from '@/components/auth/continue-with-google-button'
import { CopySuccess, DiscardDialog, SaveDialog } from '@/components/copy/copy-dialogs'
import { PlaylistSelect } from '@/components/copy/playlist-select'
import { Button } from '@/components/ui/button'
import { useReorderPlaylist } from '@/features/reorder/use-reorder-playlist'

export function ReorderPlaylistWorkspace(): JSX.Element {
  const { t } = useTranslation()
  const reorder = useReorderPlaylist()

  if (!reorder.auth.isAuthenticated) {
    return (
      <section className="mx-auto max-w-lg rounded-lg border border-border bg-card p-8 text-center">
        <ShieldAlert className="mx-auto size-10 text-primary" />
        <h2 className="mt-4 font-display text-xl font-extrabold">{t('reorder.connect.title')}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t('reorder.connect.description')}
        </p>
        <ContinueWithGoogleButton
          label={t('auth.continue')}
          connectingLabel={t('auth.connecting')}
          isSigningIn={reorder.auth.status === 'signingIn'}
          onSignIn={() => void reorder.auth.signIn()}
          className="mx-auto mt-6"
        />
      </section>
    )
  }

  if (reorder.save.status === 'succeeded') {
    return (
      <CopySuccess
        count={reorder.save.completed}
        destinationId={reorder.playlist?.id}
        onReset={reorder.handleStartOver}
        translationPrefix="reorder"
      />
    )
  }

  const isSaving = reorder.save.status === 'saving'

  const handleDrop = (
    event: DragEvent<HTMLDivElement>,
    destinationIndex: number,
  ): void => {
    event.preventDefault()
    const sourceIndex = Number(event.dataTransfer.getData('text/reorder-index'))

    if (Number.isInteger(sourceIndex)) reorder.moveVideo(sourceIndex, destinationIndex)
  }

  return (
    <>
      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border p-4">
          <PlaylistSelect
            label={t('reorder.playlist')}
            value={reorder.playlist?.id}
            playlists={reorder.playlists}
            disabled={reorder.libraryState.status === 'loading' || isSaving}
            onChange={reorder.handlePlaylistChange}
          />

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={reorder.draft.length < 2 || isSaving}
              onClick={() => reorder.sortBy('title')}
            >
              <ArrowUp />
              {t('reorder.sort.title')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={reorder.draft.length < 2 || isSaving}
              onClick={() => reorder.sortBy('channel')}
            >
              {t('reorder.sort.channel')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={reorder.draft.length < 2 || isSaving}
              onClick={() => reorder.sortBy('date')}
            >
              <CalendarDays />
              {t('reorder.sort.date')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={reorder.draft.length < 2 || isSaving}
              onClick={reorder.reverse}
            >
              <ArrowLeftRight />
              {t('reorder.sort.reverse')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={reorder.draft.length < 2 || isSaving}
              onClick={reorder.shuffle}
            >
              <Shuffle />
              {t('reorder.sort.shuffle')}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-border px-4 py-3 text-xs text-muted-foreground">
          <span>{t('reorder.preview', { count: reorder.draft.length })}</span>
          <span>{t('reorder.instructions')}</span>
        </div>

        {reorder.loadState.status === 'loading' ||
        reorder.libraryState.status === 'loading' ? (
          <LoaderCircle className="mx-auto my-12 size-8 animate-spin text-primary" />
        ) : reorder.loadState.error || reorder.libraryState.error ? (
          <div className="p-8 text-center">
            <p role="alert" className="text-sm text-destructive">
              {t(`errors.youtube.${reorder.loadState.error ?? reorder.libraryState.error ?? 'unknown'}`)}
            </p>
            {reorder.loadState.error ? (
              <Button className="mt-4" variant="outline" onClick={reorder.retry}>
                {t('reorder.retryLoad')}
              </Button>
            ) : null}
          </div>
        ) : reorder.draft.length === 0 ? (
          <p className="p-12 text-center text-sm text-muted-foreground">
            {t(reorder.playlist ? 'reorder.empty' : 'reorder.choose')}
          </p>
        ) : (
          <div className="divide-y divide-border">
            {reorder.draft.map((video, index) => (
              <div
                key={video.id}
                draggable={!isSaving}
                onDragStart={(event: DragEvent<HTMLDivElement>) => {
                  event.dataTransfer.setData('text/reorder-index', String(index))
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDrop(event, index)}
                className="grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-3 p-3"
              >
                <GripVertical className="size-4 cursor-grab text-muted-foreground" />
                <span className="w-6 text-center text-xs font-bold text-muted-foreground">
                  {index + 1}
                </span>
                <div className="flex min-w-0 items-center gap-3">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt=""
                      className="h-12 w-20 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <span className="grid h-12 w-20 shrink-0 place-items-center rounded bg-muted">
                      <Image className="size-4 text-muted-foreground" />
                    </span>
                  )}
                  <span className="min-w-0">
                    <b className="block truncate text-sm">{video.title || t('copy.untitled')}</b>
                    <small className="block truncate text-muted-foreground">
                      {video.channelTitle}
                    </small>
                  </span>
                </div>
                <div className="flex">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={index === 0 || isSaving}
                    onClick={() => reorder.moveVideo(index, 0)}
                    aria-label={t('reorder.moveTop')}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={index === 0 || isSaving}
                    onClick={() => reorder.moveVideo(index, index - 1)}
                    aria-label={t('reorder.moveUp')}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={index === reorder.draft.length - 1 || isSaving}
                    onClick={() => reorder.moveVideo(index, index + 1)}
                    aria-label={t('reorder.moveDown')}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={index === reorder.draft.length - 1 || isSaving}
                    onClick={() => reorder.moveVideo(index, reorder.draft.length - 1)}
                    aria-label={t('reorder.moveBottom')}
                  >
                    <ArrowDown />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {reorder.pendingCount > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 shadow-2xl backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <span className="min-w-0 flex-1">
              <b className="block text-sm">
                {t('reorder.pendingChanges', { count: reorder.pendingCount })}
              </b>
              <small className="text-muted-foreground">{t('reorder.quotaEstimate')}</small>
            </span>
            <Button variant="ghost" onClick={reorder.openDiscardDialog}>
              {t('common.cancel')}
            </Button>
            <Button disabled={isSaving} onClick={reorder.handleSave}>
              {t('reorder.save')}
            </Button>
          </div>
        </div>
      ) : null}

      {reorder.isDiscardDialogOpen ? (
        <DiscardDialog
          onCancel={reorder.closeDiscardDialog}
          onConfirm={reorder.handleConfirmDiscard}
          translationPrefix="reorder"
        />
      ) : null}
      <SaveDialog
        progress={reorder.save}
        onRetry={() => void reorder.save.retry()}
        onClose={reorder.handleCloseSaveError}
        translationPrefix="reorder"
      />
    </>
  )
}
