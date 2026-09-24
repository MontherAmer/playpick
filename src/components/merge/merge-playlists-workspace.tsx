import type { JSX } from 'react'

import {
  Image,
  LoaderCircle,
  Merge,
  Plus,
  ShieldAlert,
  TriangleAlert,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ContinueWithGoogleButton } from '@/components/auth/continue-with-google-button'
import { BuildConfirmDialog, BuildProgressDialog } from '@/components/build/build-dialogs'
import { PlaylistDetailsForm } from '@/components/build/playlist-details-form'
import { CopySuccess } from '@/components/copy/copy-dialogs'
import { PlaylistSelect } from '@/components/copy/playlist-select'
import { Button } from '@/components/ui/button'
import { useMergePlaylists } from '@/features/merge/use-merge-playlists'

import { MergeSourceList } from './merge-source-list'

const PREVIEW_LIMIT = 10

export function MergePlaylistsWorkspace(): JSX.Element {
  const { t } = useTranslation()
  const merge = useMergePlaylists()

  if (!merge.auth.isAuthenticated) {
    return (
      <section className="mx-auto max-w-lg rounded-lg border border-border bg-card p-8 text-center">
        <ShieldAlert className="mx-auto size-10 text-primary" />
        <h2 className="mt-4 font-display text-xl font-extrabold">{t('merge.connect.title')}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t('merge.connect.description')}
        </p>
        <ContinueWithGoogleButton
          label={t('auth.continue')}
          connectingLabel={t('auth.connecting')}
          isSigningIn={merge.auth.status === 'signingIn'}
          onSignIn={() => void merge.auth.signIn()}
          className="mx-auto mt-6"
        />
      </section>
    )
  }

  if (merge.save.status === 'succeeded') {
    return (
      <CopySuccess
        count={merge.save.completed}
        destinationId={merge.save.targetPlaylist?.id}
        onReset={merge.handleStartOver}
        translationPrefix="merge"
      />
    )
  }

  const availablePlaylists = merge.playlists.filter(
    (playlist) => !merge.selected.some((selected) => selected.id === playlist.id),
  )
  const destinationName =
    merge.destinationKind === 'existing'
      ? merge.destinationPlaylist?.title ?? ''
      : merge.resultDraft.title.trim()
  const isSaving = merge.save.status === 'creating' || merge.save.status === 'adding'

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <div className="min-w-0 space-y-5">
          <section>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-extrabold">{t('merge.sources.title')}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('merge.sources.description')}
                </p>
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                {t('merge.sources.selected', { count: merge.selected.length })}
              </span>
            </div>

            <MergeSourceList
              playlists={merge.selected}
              states={merge.sourceStates}
              onMove={merge.handleMoveSource}
              onRemove={merge.handleRemoveSource}
              onRetry={merge.retrySource}
            />

            <div className="mt-3 flex gap-2 rounded-lg border border-border bg-card p-3">
              <select
                value={merge.sourcePickerId}
                disabled={merge.libraryState.status === 'loading'}
                onChange={(event) => merge.setSourcePickerId(event.target.value)}
                className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">{t('merge.sources.choose')}</option>
                {availablePlaylists.map((playlist) => (
                  <option key={playlist.id} value={playlist.id}>
                    {playlist.title || t('copy.untitled')} · {playlist.itemCount}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                disabled={!merge.sourcePickerId}
                onClick={merge.handleAddSource}
              >
                <Plus />
                {t('merge.sources.add')}
              </Button>
            </div>
            {merge.libraryState.error ? (
              <p role="alert" className="mt-2 text-sm text-destructive">
                {t(`errors.youtube.${merge.libraryState.error}`)}
              </p>
            ) : null}
          </section>

          <section className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div>
                <h2 className="font-display font-extrabold">{t('merge.preview.title')}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('merge.preview.description')}
                </p>
              </div>
              {merge.isLoadingSources ? (
                <LoaderCircle className="size-5 animate-spin text-primary" />
              ) : null}
            </div>
            {merge.entries.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">
                {t('merge.preview.empty')}
              </p>
            ) : (
              <div className="divide-y divide-border">
                {merge.entries.slice(0, PREVIEW_LIMIT).map((entry, index) => (
                  <div key={entry.key} className="flex items-center gap-3 p-3">
                    <span className="w-6 text-center text-xs font-bold text-muted-foreground">
                      {index + 1}
                    </span>
                    {entry.video.thumbnailUrl ? (
                      <img
                        src={entry.video.thumbnailUrl}
                        alt=""
                        className="h-11 w-[72px] shrink-0 rounded object-cover"
                      />
                    ) : (
                      <span className="grid h-11 w-[72px] shrink-0 place-items-center rounded bg-muted">
                        <Image className="size-4 text-muted-foreground" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <b className="block truncate text-sm">{entry.video.title}</b>
                      <small className="block truncate text-muted-foreground">
                        {entry.sourcePlaylistTitle}
                      </small>
                    </span>
                    {entry.isDuplicate ? (
                      <span className="hidden rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-bold text-amber-700 sm:inline dark:text-amber-300">
                        {t('merge.preview.duplicate')}
                      </span>
                    ) : null}
                  </div>
                ))}
                {merge.entries.length > PREVIEW_LIMIT ? (
                  <p className="p-3 text-center text-xs text-muted-foreground">
                    {t('merge.preview.more', {
                      count: merge.entries.length - PREVIEW_LIMIT,
                    })}
                  </p>
                ) : null}
              </div>
            )}
          </section>
        </div>

        <aside className="h-fit overflow-hidden rounded-lg border border-border bg-card lg:sticky lg:top-24">
          <div className="border-b border-border p-5">
            <h2 className="font-display text-lg font-extrabold">{t('merge.destination.title')}</h2>
            <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
              <Button
                variant={merge.destinationKind === 'new' ? 'secondary' : 'ghost'}
                onClick={() => merge.setDestinationKind('new')}
              >
                {t('merge.destination.new')}
              </Button>
              <Button
                variant={merge.destinationKind === 'existing' ? 'secondary' : 'ghost'}
                onClick={() => merge.setDestinationKind('existing')}
              >
                {t('merge.destination.existing')}
              </Button>
            </div>
            <div className="mt-4">
              {merge.destinationKind === 'new' ? (
                <PlaylistDetailsForm
                  draft={merge.resultDraft}
                  disabled={isSaving}
                  onChange={merge.updateResultDraft}
                />
              ) : (
                <>
                  <PlaylistSelect
                    label={t('merge.destination.playlist')}
                    value={merge.destinationPlaylist?.id}
                    playlists={merge.playlists}
                    onChange={merge.handleDestinationPlaylistChange}
                  />
                  {merge.destinationState.status === 'loading' ? (
                    <LoaderCircle className="mx-auto mt-4 size-5 animate-spin text-primary" />
                  ) : merge.destinationState.error ? (
                    <p role="alert" className="mt-3 text-sm text-destructive">
                      {t(`errors.youtube.${merge.destinationState.error}`)}
                    </p>
                  ) : null}
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 border-b border-border p-4">
            {[
              ['sources', merge.selected.length],
              ['total', merge.entries.length],
              ['duplicates', merge.duplicateCount],
              ['willAdd', merge.plan.length],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md bg-muted p-2 text-center">
                <b className="block text-lg">{value}</b>
                <small className="text-muted-foreground">{t(`merge.stats.${label}`)}</small>
              </div>
            ))}
          </div>

          <div className="space-y-3 p-5">
            <label className="flex items-center justify-between gap-3 text-sm font-semibold">
              {t('merge.removeDuplicates')}
              <input
                type="checkbox"
                checked={merge.removeDuplicates}
                onChange={(event) => merge.setRemoveDuplicates(event.target.checked)}
                className="size-4 accent-primary"
              />
            </label>
            {merge.unavailableCount > 0 ? (
              <p className="flex gap-2 text-xs text-amber-700 dark:text-amber-300">
                <TriangleAlert className="size-4 shrink-0" />
                {t('merge.unavailable', { count: merge.unavailableCount })}
              </p>
            ) : null}
            {merge.hasSourceError ? (
              <p className="text-xs text-destructive">{t('merge.sourceError')}</p>
            ) : null}
            <p className="text-xs leading-5 text-muted-foreground">{t('merge.keepsSources')}</p>
            <Button
              className="w-full"
              disabled={!merge.canMerge || isSaving}
              onClick={merge.openConfirmDialog}
            >
              <Merge />
              {t('merge.action')}
            </Button>
          </div>
        </aside>
      </div>

      {merge.isConfirmDialogOpen ? (
        <BuildConfirmDialog
          count={merge.plan.length}
          playlistName={destinationName}
          onCancel={merge.closeConfirmDialog}
          onConfirm={merge.handleConfirmMerge}
          translationPrefix="merge"
        />
      ) : null}
      <BuildProgressDialog
        state={merge.save}
        onClose={merge.save.reset}
        onRetry={() => void merge.save.retry()}
        translationPrefix="merge"
      />
    </>
  )
}
