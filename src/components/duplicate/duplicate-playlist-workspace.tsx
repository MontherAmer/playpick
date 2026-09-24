import type { JSX } from 'react'

import {
  CircleAlert,
  Copy,
  Image,
  LoaderCircle,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ContinueWithGoogleButton } from '@/components/auth/continue-with-google-button'
import { BuildConfirmDialog, BuildProgressDialog } from '@/components/build/build-dialogs'
import { PlaylistDetailsForm } from '@/components/build/playlist-details-form'
import { CopySuccess } from '@/components/copy/copy-dialogs'
import { PlaylistSelect } from '@/components/copy/playlist-select'
import { Button } from '@/components/ui/button'
import { useDuplicatePlaylist } from '@/features/duplicate/use-duplicate-playlist'
import { cn } from '@/lib/cn'

const PREVIEW_LIMIT = 12

export function DuplicatePlaylistWorkspace(): JSX.Element {
  const { t } = useTranslation()
  const duplicate = useDuplicatePlaylist()

  if (!duplicate.auth.isAuthenticated) {
    return (
      <section className="mx-auto max-w-lg rounded-lg border border-border bg-card p-8 text-center">
        <ShieldAlert className="mx-auto size-10 text-primary" />
        <h2 className="mt-4 font-display text-xl font-extrabold">
          {t('duplicate.connect.title')}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t('duplicate.connect.description')}
        </p>
        <ContinueWithGoogleButton
          label={t('auth.continue')}
          connectingLabel={t('auth.connecting')}
          isSigningIn={duplicate.auth.status === 'signingIn'}
          onSignIn={() => void duplicate.auth.signIn()}
          className="mx-auto mt-6"
        />
      </section>
    )
  }

  if (duplicate.save.status === 'succeeded') {
    return (
      <div className="space-y-4">
        <CopySuccess
          count={duplicate.save.completed}
          destinationId={duplicate.save.targetPlaylist?.id}
          onReset={duplicate.handleStartOver}
          translationPrefix="duplicate"
        />
        {duplicate.plan.unavailableCount > 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            {t('duplicate.success.excluded', {
              count: duplicate.plan.unavailableCount,
            })}
          </p>
        ) : null}
      </div>
    )
  }

  const isSaving =
    duplicate.save.status === 'creating' || duplicate.save.status === 'adding'

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <PlaylistSelect
            label={t('duplicate.sourcePlaylist')}
            value={duplicate.sourcePlaylist?.id}
            playlists={duplicate.playlists}
            disabled={duplicate.libraryState.status === 'loading' || isSaving}
            onChange={duplicate.handleSourceChange}
          />

          {duplicate.sourcePlaylist ? (
            <div className="p-5">
              {duplicate.sourcePlaylist.thumbnailUrl ? (
                <img
                  src={duplicate.sourcePlaylist.thumbnailUrl}
                  alt=""
                  className="aspect-video w-full rounded-lg object-cover"
                />
              ) : (
                <div className="grid aspect-video w-full place-items-center rounded-lg bg-muted">
                  <Image className="size-8 text-muted-foreground" />
                </div>
              )}
              <h2 className="mt-4 font-display text-lg font-extrabold">
                {duplicate.sourcePlaylist.title || t('copy.untitled')}
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ['total', duplicate.plan.totalItems],
                  ['copyable', duplicate.plan.copyableCount],
                  ['repeated', duplicate.plan.repeatedCount],
                  ['unavailable', duplicate.plan.unavailableCount],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md bg-muted p-2 text-center">
                    <b className="block text-lg">{value}</b>
                    <small className="text-muted-foreground">
                      {t(`duplicate.stats.${label}`)}
                    </small>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="p-8 text-center text-sm text-muted-foreground">
              {t('duplicate.chooseSource')}
            </p>
          )}

          {duplicate.libraryState.error ? (
            <p role="alert" className="px-5 pb-5 text-sm text-destructive">
              {t(`errors.youtube.${duplicate.libraryState.error}`)}
            </p>
          ) : null}
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-display text-lg font-extrabold">
            {t('duplicate.detailsTitle')}
          </h2>
          <div className="mt-5">
            <PlaylistDetailsForm
              draft={duplicate.playlistDraft}
              disabled={isSaving}
              onChange={duplicate.updatePlaylistDraft}
            />
          </div>
          <div className="mt-6 rounded-lg bg-primary-soft/50 p-4 text-sm text-muted-foreground">
            <b className="text-foreground">{t('duplicate.keepsSourceTitle')}</b>
            <p className="mt-1">{t('duplicate.keepsSource')}</p>
          </div>
          <Button
            className="mt-6 w-full"
            disabled={!duplicate.canDuplicate || isSaving}
            onClick={duplicate.openConfirmDialog}
          >
            <Copy />
            {t('duplicate.action')}
          </Button>
        </section>
      </div>

      <section className="mt-6 overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h2 className="font-display font-extrabold">{t('duplicate.preview.title')}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('duplicate.preview.description')}
            </p>
          </div>
          {duplicate.sourceState.status === 'loading' ? (
            <LoaderCircle className="size-5 animate-spin text-primary" />
          ) : null}
        </div>

        {duplicate.sourceState.status === 'failed' ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <CircleAlert className="size-7 text-destructive" />
            <p role="alert" className="text-sm text-destructive">
              {t(`errors.youtube.${duplicate.sourceState.error ?? 'unknown'}`)}
            </p>
            <Button variant="outline" onClick={duplicate.retrySource}>
              <RotateCcw />
              {t('duplicate.retrySource')}
            </Button>
          </div>
        ) : duplicate.sourceVideos.length === 0 &&
          duplicate.sourceState.status !== 'loading' ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            {t('duplicate.preview.empty')}
          </p>
        ) : (
          <div className="divide-y divide-border">
            {duplicate.sourceVideos.slice(0, PREVIEW_LIMIT).map((video, index) => (
              <div
                key={video.id}
                className={cn('flex items-center gap-3 p-3', video.isUnavailable && 'opacity-50')}
              >
                <span className="w-6 text-center text-xs font-bold text-muted-foreground">
                  {index + 1}
                </span>
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt=""
                    className="h-11 w-[72px] shrink-0 rounded object-cover"
                  />
                ) : (
                  <span className="grid h-11 w-[72px] shrink-0 place-items-center rounded bg-muted">
                    <Image className="size-4 text-muted-foreground" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-sm">{video.title || t('copy.untitled')}</b>
                  <small className="block truncate text-muted-foreground">
                    {video.channelTitle}
                  </small>
                </span>
                {video.isUnavailable ? (
                  <span className="rounded-full bg-destructive/10 px-2 py-1 text-[10px] font-bold text-destructive">
                    {t('duplicate.preview.unavailable')}
                  </span>
                ) : null}
              </div>
            ))}
            {duplicate.sourceVideos.length > PREVIEW_LIMIT ? (
              <p className="p-3 text-center text-xs text-muted-foreground">
                {t('duplicate.preview.more', {
                  count: duplicate.sourceVideos.length - PREVIEW_LIMIT,
                })}
              </p>
            ) : null}
          </div>
        )}
      </section>

      {duplicate.isConfirmDialogOpen ? (
        <BuildConfirmDialog
          count={duplicate.plan.copyableCount}
          playlistName={duplicate.playlistDraft.title.trim()}
          onCancel={duplicate.closeConfirmDialog}
          onConfirm={duplicate.handleConfirmDuplicate}
          translationPrefix="duplicate"
        />
      ) : null}
      <BuildProgressDialog
        state={duplicate.save}
        onClose={duplicate.save.reset}
        onRetry={() => void duplicate.save.retry()}
        translationPrefix="duplicate"
      />
    </>
  )
}
