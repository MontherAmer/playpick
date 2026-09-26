import type { JSX } from 'react'

import { ArrowLeftRight, ArrowRight, CheckSquare, LoaderCircle, ShieldAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { YouTubeErrorCode } from '@/api/youtube/errors'
import { ContinueWithGoogleButton } from '@/components/auth/continue-with-google-button'
import { BuildConfirmDialog } from '@/components/build/build-dialogs'
import { SaveDialog } from '@/components/copy/copy-dialogs'
import { PlaylistSelect } from '@/components/copy/playlist-select'
import { Button } from '@/components/ui/button'
import { COMPARE_FILTERS, COMPARE_STAT_KEYS } from '@/features/compare/compare.constants'
import { useComparePlaylists } from '@/features/compare/use-compare-playlists'
import { cn } from '@/lib/cn'
import type { IPlaylist, LoadStatus } from '@/models/copy.interface'

import { CompareVideoList } from './compare-video-list'

export function ComparePlaylistsWorkspace(): JSX.Element {
  const { t } = useTranslation()
  const compare = useComparePlaylists()

  if (!compare.auth.isAuthenticated) {
    return (
      <section className="mx-auto max-w-lg rounded-lg border border-border bg-card p-8 text-center">
        <ShieldAlert className="mx-auto size-10 text-primary" />
        <h2 className="mt-4 font-display text-xl font-extrabold">
          {t('compare.connect.title')}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t('compare.connect.description')}
        </p>
        <ContinueWithGoogleButton
          label={t('auth.continue')}
          connectingLabel={t('auth.connecting')}
          isSigningIn={compare.auth.status === 'signingIn'}
          onSignIn={() => void compare.auth.signIn()}
          className="mx-auto mt-6"
        />
      </section>
    )
  }

  const isSaving = compare.save.status === 'saving'

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <ComparePlaylistCard
          label={t('compare.playlistA')}
          value={compare.playlistA?.id}
          playlists={compare.playlists}
          excludedId={compare.playlistB?.id}
          disabled={compare.libraryState.status === 'loading' || isSaving}
          status={compare.stateA.status}
          error={compare.stateA.error}
          videoCount={compare.summary.totalA}
          libraryError={compare.libraryState.error}
          onChange={compare.handlePlaylistAChange}
          onRetry={compare.retryPlaylistA}
        />
        <ComparePlaylistCard
          label={t('compare.playlistB')}
          value={compare.playlistB?.id}
          playlists={compare.playlists}
          excludedId={compare.playlistA?.id}
          disabled={compare.libraryState.status === 'loading' || isSaving}
          status={compare.stateB.status}
          error={compare.stateB.error}
          videoCount={compare.summary.totalB}
          libraryError={compare.libraryState.error}
          onChange={compare.handlePlaylistBChange}
          onRetry={compare.retryPlaylistB}
        />
      </div>

      <div className="my-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {COMPARE_STAT_KEYS.map((statKey) => (
          <div
            key={statKey}
            className={cn(
              'rounded-lg border p-4',
              statKey === 'shared'
                ? 'border-primary bg-primary-soft'
                : 'border-border bg-card',
            )}
          >
            <span className="text-xs text-muted-foreground">
              {t(`compare.stats.${statKey}`)}
            </span>
            <b className="mt-1 block text-2xl">{compare.summary[statKey]}</b>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="mb-0 flex flex-wrap items-center justify-between gap-3 p-5 pb-3">
          <div className="flex rounded-lg bg-muted p-1">
            {COMPARE_FILTERS.map((filter) => (
              <Button
                key={filter}
                size="sm"
                variant={compare.filter === filter ? 'secondary' : 'ghost'}
                onClick={() => compare.setFilter(filter)}
              >
                {t(`compare.filters.${filter}`)}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={compare.copyableToA.length === 0 || isSaving}
              onClick={() => compare.handleRequestCopy('toA')}
            >
              {t('compare.copyToA')}
              <ArrowLeftRight />
            </Button>
            <Button
              size="sm"
              disabled={compare.copyableToB.length === 0 || isSaving}
              onClick={() => compare.handleRequestCopy('toB')}
            >
              {t('compare.copyToB')}
              <ArrowRight />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 pb-4">
          <Button
            variant="ghost"
            size="sm"
            disabled={compare.visibleRows.length === 0}
            onClick={compare.handleToggleAllVisible}
          >
            <CheckSquare />
            {t(compare.allVisibleSelected ? 'compare.deselectAll' : 'compare.selectAll')}
          </Button>
          <span className="text-xs text-muted-foreground">
            {t('compare.selectedCount', { count: compare.selectedVideoIds.size })}
          </span>
        </div>

        <CompareVideoList
          rows={compare.visibleRows}
          selectedVideoIds={compare.selectedVideoIds}
          emptyMessage={t(compare.isReady ? 'compare.emptyFilter' : 'compare.chooseBoth')}
          onToggle={compare.handleToggleVideo}
        />
      </section>

      {compare.pendingCopy ? (
        <BuildConfirmDialog
          count={compare.pendingCopy.videos.length}
          playlistName={compare.pendingCopy.destination.title}
          onCancel={compare.closeConfirmDialog}
          onConfirm={compare.handleConfirmCopy}
          translationPrefix="compare"
        />
      ) : null}
      <SaveDialog
        progress={compare.save}
        onRetry={() => void compare.save.retry()}
        onClose={compare.handleCloseSaveError}
        translationPrefix="compare"
      />
    </>
  )
}

interface IComparePlaylistCardProps {
  label: string
  value?: string
  playlists: readonly IPlaylist[]
  excludedId?: string
  disabled: boolean
  status: LoadStatus
  error: YouTubeErrorCode | null
  videoCount: number
  libraryError: YouTubeErrorCode | null
  onChange: (playlistId: string) => void
  onRetry: () => void
}

function ComparePlaylistCard({
  label,
  value,
  playlists,
  excludedId,
  disabled,
  status,
  error,
  videoCount,
  libraryError,
  onChange,
  onRetry,
}: IComparePlaylistCardProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <PlaylistSelect
        label={label}
        value={value}
        playlists={playlists}
        excludedId={excludedId}
        disabled={disabled}
        onChange={onChange}
      />
      <div className="px-4 py-3 text-xs text-muted-foreground">
        {libraryError && status === 'idle' ? (
          <p role="alert" className="text-destructive">
            {t(`errors.youtube.${libraryError}`)}
          </p>
        ) : status === 'loading' ? (
          <LoaderCircle className="size-4 animate-spin text-primary" />
        ) : status === 'failed' ? (
          <p role="alert" className="flex items-center gap-2 text-destructive">
            <span>{t(`errors.youtube.${error ?? 'unknown'}`)}</span>
            <Button size="sm" variant="ghost" onClick={onRetry}>
              {t('compare.retryLoad')}
            </Button>
          </p>
        ) : status === 'ready' ? (
          t('compare.videoCount', { count: videoCount })
        ) : (
          t('compare.videoCountHint')
        )}
      </div>
    </section>
  )
}
