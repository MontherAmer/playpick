import type { DragEvent, FormEvent, JSX } from 'react'

import {
  ArrowRight,
  CheckSquare,
  ListPlus,
  LoaderCircle,
  Search,
  ShieldAlert,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ContinueWithGoogleButton } from '@/components/auth/continue-with-google-button'
import { CopySuccess } from '@/components/copy/copy-dialogs'
import { PlaylistSelect } from '@/components/copy/playlist-select'
import { SourceTabs } from '@/components/copy/source-tabs'
import { SourceVideoList } from '@/components/copy/video-lists'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useBuildPlaylist } from '@/features/build/use-build-playlist'
import { cn } from '@/lib/cn'

import { BuildDraftList } from './build-draft-list'
import {
  BuildConfirmDialog,
  BuildDiscardDialog,
  BuildProgressDialog,
} from './build-dialogs'
import { PlaylistDetailsForm } from './playlist-details-form'

export function BuildPlaylistWorkspace(): JSX.Element {
  const { t } = useTranslation()
  const build = useBuildPlaylist()

  if (!build.auth.isAuthenticated) {
    return (
      <section className="mx-auto max-w-lg rounded-lg border border-border bg-card p-8 text-center">
        <ShieldAlert className="mx-auto size-10 text-primary" />
        <h2 className="mt-4 font-display text-xl font-extrabold">{t('build.connect.title')}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t('build.connect.description')}
        </p>
        <ContinueWithGoogleButton
          label={t('auth.continue')}
          connectingLabel={t('auth.connecting')}
          isSigningIn={build.auth.status === 'signingIn'}
          onSignIn={() => void build.auth.signIn()}
          className="mx-auto mt-6"
        />
      </section>
    )
  }

  if (build.save.status === 'succeeded') {
    return (
      <CopySuccess
        count={build.save.completed}
        destinationId={build.save.targetPlaylist?.id}
        onReset={build.handleStartOver}
        translationPrefix="build"
      />
    )
  }

  const handleExternalSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    void build.loadExternalSource()
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault()
    const videoId = event.dataTransfer.getData('text/plain')
    const video = build.sourceVideos.find((candidate) => candidate.videoId === videoId)

    if (video) build.draft.addVideos([video])
  }

  const allVisibleSelected =
    build.sourceVideos.length > 0 &&
    build.sourceVideos.every((video) => build.selectedVideoIds.has(video.videoId))
  const isSaving = build.save.status === 'creating' || build.save.status === 'adding'

  return (
    <>
      <div className="mb-6 inline-flex rounded-lg bg-muted p-1">
        <Button
          variant={build.mode === 'empty' ? 'secondary' : 'ghost'}
          onClick={() => build.setMode('empty')}
        >
          {t('build.modes.empty')}
        </Button>
        <Button
          variant={build.mode === 'build' ? 'secondary' : 'ghost'}
          onClick={() => build.setMode('build')}
        >
          {t('build.modes.build')}
        </Button>
      </div>

      {build.mode === 'empty' ? (
        <section className="max-w-xl rounded-lg border border-border bg-card p-6">
          <h2 className="font-display text-lg font-extrabold">{t('build.detailsTitle')}</h2>
          <div className="mt-5">
            <PlaylistDetailsForm
              draft={build.playlistDraft}
              disabled={isSaving}
              onChange={build.updatePlaylistDraft}
            />
          </div>
          <Button
            className="mt-6"
            disabled={!build.canSave || isSaving}
            onClick={build.openConfirmDialog}
          >
            <ListPlus />
            {t('build.create')}
          </Button>
        </section>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="overflow-hidden rounded-lg border border-border bg-card">
            <SourceTabs value={build.sourceMode} onChange={build.handleSourceModeChange} />

            {build.sourceMode === 'mine' ? (
              <PlaylistSelect
                label={t('build.sourcePlaylist')}
                value={build.sourcePlaylist?.id}
                playlists={build.playlists}
                disabled={build.libraryState.status === 'loading'}
                onChange={build.handleSourcePlaylistChange}
              />
            ) : null}

            {build.sourceMode === 'saved' ? (
              <div className="border-b border-border p-6 text-sm leading-6 text-muted-foreground">
                <ShieldAlert className="mb-2 size-5 text-amber-500" />
                {t('copy.savedUnavailable')}
              </div>
            ) : null}

            {['playlist', 'search', 'paste'].includes(build.sourceMode) ? (
              <form
                className="flex gap-2 border-b border-border p-4"
                onSubmit={handleExternalSubmit}
              >
                <Input
                  value={build.sourceInput}
                  onChange={(event) => build.setSourceInput(event.target.value)}
                  placeholder={t(`copy.sourceInput.${build.sourceMode}`)}
                />
                <Button type="submit" disabled={build.sourceState.status === 'loading'}>
                  {build.sourceMode === 'search' ? <Search /> : <ArrowRight />}
                  {t('copy.load')}
                </Button>
              </form>
            ) : null}

            <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
              <Button
                variant="ghost"
                size="sm"
                disabled={build.sourceVideos.length === 0}
                onClick={build.handleToggleAllVisible}
              >
                <CheckSquare />
                {t(allVisibleSelected ? 'copy.deselectAll' : 'copy.selectAll')}
              </Button>
              <span className="text-xs text-muted-foreground">
                {t('copy.selectedCount', { count: build.selectedVideoIds.size })}
              </span>
              <Input
                value={build.sourceFilter}
                onChange={(event) => build.setSourceFilter(event.target.value)}
                placeholder={t('copy.filter')}
                className="ms-auto w-36 sm:w-44"
              />
              <Button
                size="sm"
                disabled={build.selectedVideoIds.size === 0}
                onClick={build.handleAddSelected}
              >
                {t('build.addToDraft')}
              </Button>
            </div>

            {build.sourceState.status === 'loading' || build.libraryState.status === 'loading' ? (
              <LoaderCircle className="mx-auto my-10 size-7 animate-spin text-primary" />
            ) : build.sourceState.error || build.libraryState.error ? (
              <p role="alert" className="p-6 text-sm text-destructive">
                {t(`errors.youtube.${build.sourceState.error ?? build.libraryState.error ?? 'unknown'}`)}
              </p>
            ) : (
              <div className="max-h-[560px] overflow-y-auto">
                <SourceVideoList
                  videos={build.sourceVideos}
                  selectedVideoIds={build.selectedVideoIds}
                  disabled={false}
                  onToggle={build.handleToggleVideo}
                  onAdd={(video) => build.draft.addVideos([video])}
                />
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="border-b border-border p-5">
              <h2 className="font-display text-lg font-extrabold">{t('build.draft.title')}</h2>
              <div className="mt-4">
                <PlaylistDetailsForm
                  draft={build.playlistDraft}
                  disabled={isSaving}
                  onChange={build.updatePlaylistDraft}
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-border p-4">
              <span>
                <b className="block text-sm">
                  {t('build.draft.ready', { count: build.draft.additionCount })}
                </b>
                <small className="text-muted-foreground">
                  {t('build.draft.duplicates', { count: build.draft.duplicateCount })}
                </small>
              </span>
              <label
                className={cn(
                  'flex items-center gap-2 text-xs font-semibold',
                  build.draft.duplicateCount === 0 && 'opacity-50',
                )}
              >
                <input
                  type="checkbox"
                  checked={build.draft.includeDuplicates}
                  disabled={build.draft.duplicateCount === 0}
                  onChange={(event) =>
                    build.draft.setIncludeDuplicates(event.target.checked)
                  }
                  className="size-4 accent-primary"
                />
                {t('build.draft.includeDuplicates')}
              </label>
            </div>
            <div
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
              className="max-h-[460px] overflow-y-auto"
            >
              <BuildDraftList
                entries={build.draft.entries}
                onMove={build.draft.move}
                onRemove={build.draft.remove}
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-border p-4">
              <Button
                variant="ghost"
                disabled={build.draft.entries.length === 0}
                onClick={build.openDiscardDialog}
              >
                {t('common.cancel')}
              </Button>
              <Button
                disabled={!build.canSave || isSaving}
                onClick={build.openConfirmDialog}
              >
                {t('build.createAndAdd')}
              </Button>
            </div>
          </section>
        </div>
      )}

      {build.isConfirmDialogOpen ? (
        <BuildConfirmDialog
          count={build.mode === 'empty' ? 0 : build.draft.additionCount}
          playlistName={build.playlistDraft.title.trim()}
          onCancel={build.closeConfirmDialog}
          onConfirm={build.handleConfirmSave}
        />
      ) : null}
      {build.isDiscardDialogOpen ? (
        <BuildDiscardDialog
          onCancel={build.closeDiscardDialog}
          onConfirm={build.confirmDiscard}
        />
      ) : null}
      <BuildProgressDialog
        state={build.save}
        onClose={build.save.reset}
        onRetry={() => void build.save.retry()}
      />
    </>
  )
}
