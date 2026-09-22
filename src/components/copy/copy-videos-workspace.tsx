import type { DragEvent, FormEvent, JSX } from 'react'

import { ArrowRight, CheckSquare, LoaderCircle, Search, ShieldAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ContinueWithGoogleButton } from '@/components/auth/continue-with-google-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCopyVideos } from '@/features/copy/use-copy-videos'

import {
  CopySuccess,
  DiscardDialog,
  DuplicateDialog,
  SaveDialog,
} from './copy-dialogs'
import { PlaylistSelect } from './playlist-select'
import { SourceTabs } from './source-tabs'
import { DestinationVideoList, SourceVideoList } from './video-lists'

export function CopyVideosWorkspace(): JSX.Element {
  const { t } = useTranslation()
  const copy = useCopyVideos()

  if (!copy.auth.isAuthenticated) {
    return (
      <section className="mx-auto max-w-lg rounded-lg border border-border bg-card p-8 text-center">
        <ShieldAlert className="mx-auto size-10 text-primary" />
        <h2 className="mt-4 font-display text-xl font-extrabold">{t('copy.connect.title')}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t('copy.connect.description')}
        </p>
        <ContinueWithGoogleButton
          label={t('auth.continue')}
          connectingLabel={t('auth.connecting')}
          isSigningIn={copy.auth.status === 'signingIn'}
          onSignIn={() => void copy.auth.signIn()}
          className="mx-auto mt-6"
        />
      </section>
    )
  }

  if (copy.save.status === 'succeeded') {
    return (
      <CopySuccess
        count={copy.save.completed}
        destinationId={copy.destinationPlaylist?.id}
        onReset={copy.handleResetAfterSuccess}
      />
    )
  }

  const handleExternalSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    void copy.loadExternalSource()
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault()
    const videoId = event.dataTransfer.getData('text/plain')
    const video = copy.sourceVideos.find((candidate) => candidate.videoId === videoId)

    if (video) copy.handleAddVideos([video])
  }

  const canAdd =
    copy.destinationState.status === 'ready' && copy.selectedVideoIds.size > 0
  const allVisibleSelected =
    copy.sourceVideos.length > 0 &&
    copy.sourceVideos.every((video) => copy.selectedVideoIds.has(video.videoId))

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <SourceTabs value={copy.sourceMode} onChange={copy.handleSourceModeChange} />

          {copy.sourceMode === 'mine' ? (
            <PlaylistSelect
              label={t('copy.sourcePlaylist')}
              value={copy.sourcePlaylist?.id}
              playlists={copy.playlists}
              excludedId={copy.destinationPlaylist?.id}
              disabled={copy.libraryState.status === 'loading'}
              onChange={copy.handleSourcePlaylistChange}
            />
          ) : null}

          {copy.sourceMode === 'saved' ? (
            <div className="border-b border-border p-6 text-sm leading-6 text-muted-foreground">
              <ShieldAlert className="mb-2 size-5 text-amber-500" />
              {t('copy.savedUnavailable')}
            </div>
          ) : null}

          {['playlist', 'search', 'paste'].includes(copy.sourceMode) ? (
            <form className="flex gap-2 border-b border-border p-4" onSubmit={handleExternalSubmit}>
              <Input
                value={copy.sourceInput}
                onChange={(event) => copy.setSourceInput(event.target.value)}
                placeholder={t(`copy.sourceInput.${copy.sourceMode}`)}
                aria-label={t(`copy.sourceInput.${copy.sourceMode}`)}
              />
              <Button type="submit" disabled={copy.sourceState.status === 'loading'}>
                {copy.sourceMode === 'search' ? <Search /> : <ArrowRight />}
                {t('copy.load')}
              </Button>
            </form>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
            <Button
              variant="ghost"
              size="sm"
              disabled={copy.sourceVideos.length === 0}
              onClick={copy.handleToggleAllVisible}
            >
              <CheckSquare />
              {t(allVisibleSelected ? 'copy.deselectAll' : 'copy.selectAll')}
            </Button>
            <span className="text-xs text-muted-foreground">
              {t('copy.selectedCount', { count: copy.selectedVideoIds.size })}
            </span>
            <Input
              value={copy.sourceFilter}
              onChange={(event) => copy.setSourceFilter(event.target.value)}
              placeholder={t('copy.filter')}
              className="ms-auto w-36 sm:w-44"
            />
            <Button size="sm" disabled={!canAdd} onClick={copy.handleAddSelected}>
              {t('copy.addSelected')}
            </Button>
          </div>

          {copy.sourceState.status === 'loading' || copy.libraryState.status === 'loading' ? (
            <LoaderCircle className="mx-auto my-10 size-7 animate-spin text-primary" />
          ) : copy.sourceState.error || copy.libraryState.error ? (
            <p role="alert" className="p-6 text-sm text-destructive">
              {t(`errors.youtube.${copy.sourceState.error ?? copy.libraryState.error ?? 'unknown'}`)}
            </p>
          ) : (
            <div className="max-h-[520px] overflow-y-auto">
              <SourceVideoList
                videos={copy.sourceVideos}
                selectedVideoIds={copy.selectedVideoIds}
                disabled={copy.destinationState.status !== 'ready'}
                onToggle={copy.handleToggleVideo}
                onAdd={(video) => copy.handleAddVideos([video])}
              />
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <PlaylistSelect
            label={t('copy.destinationPlaylist')}
            value={copy.destinationPlaylist?.id}
            playlists={copy.playlists}
            excludedId={copy.sourcePlaylist?.id}
            disabled={copy.libraryState.status === 'loading'}
            onChange={copy.handleDestinationPlaylistChange}
          />
          <div className="grid grid-cols-2 gap-2 border-b border-border p-4 sm:grid-cols-4">
            {[
              ['existing', copy.destinationVideos.length],
              ['pending', copy.pendingCount],
              ['duplicates', copy.duplicateCount],
              ['total', copy.destinationVideos.length + copy.pendingCount],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md bg-muted p-2 text-center">
                <b className="block text-lg">{value}</b>
                <small className="text-muted-foreground">{t(`copy.stats.${label}`)}</small>
              </div>
            ))}
          </div>
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            className="m-4 rounded-lg border border-dashed border-primary/40 bg-primary-soft/40 p-5 text-center text-sm text-muted-foreground"
          >
            {t('copy.dropZone')}
          </div>
          {copy.destinationState.status === 'loading' ? (
            <LoaderCircle className="mx-auto my-10 size-7 animate-spin text-primary" />
          ) : copy.destinationState.error ? (
            <p role="alert" className="p-6 text-sm text-destructive">
              {t(`errors.youtube.${copy.destinationState.error}`)}
            </p>
          ) : (
            <div className="max-h-[520px] overflow-y-auto">
              <DestinationVideoList
                existingVideos={copy.destinationVideos}
                pending={copy.pending}
                onRemovePending={copy.handleRemovePending}
              />
            </div>
          )}
        </section>
      </div>

      {copy.pending.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 shadow-2xl backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <span className="min-w-0 flex-1">
              <b className="block text-sm">{t('copy.pendingChanges', { count: copy.pendingCount })}</b>
              {copy.duplicateCount > 0 ? (
                <small className="text-amber-700 dark:text-amber-300">
                  {t('copy.duplicateCount', { count: copy.duplicateCount })}
                </small>
              ) : null}
            </span>
            <Button variant="ghost" onClick={copy.openDiscardDialog}>{t('common.cancel')}</Button>
            <Button disabled={copy.pendingCount === 0} onClick={copy.handleRequestSave}>
              {t('copy.save')}
            </Button>
          </div>
        </div>
      ) : null}

      {copy.isDiscardDialogOpen ? (
        <DiscardDialog onCancel={copy.closeDiscardDialog} onConfirm={copy.handleDiscard} />
      ) : null}
      {copy.isDuplicateDialogOpen ? (
        <DuplicateDialog
          count={copy.duplicateCount}
          onCancel={copy.closeDuplicateDialog}
          onConfirm={copy.handleSaveAfterDuplicateChoice}
        />
      ) : null}
      <SaveDialog
        progress={copy.save}
        onRetry={() => void copy.save.retry()}
        onClose={copy.save.reset}
      />
    </>
  )
}
