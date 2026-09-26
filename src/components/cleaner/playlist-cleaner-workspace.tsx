import type { JSX } from 'react'

import { CheckSquare, RefreshCw, ShieldAlert, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ContinueWithGoogleButton } from '@/components/auth/continue-with-google-button'
import { BuildConfirmDialog } from '@/components/build/build-dialogs'
import { CopySuccess, SaveDialog } from '@/components/copy/copy-dialogs'
import { PlaylistSelect } from '@/components/copy/playlist-select'
import { Button } from '@/components/ui/button'
import {
  CLEANER_STAT_KEYS,
  CLEANER_STAT_TONES,
} from '@/features/cleaner/cleaner.constants'
import { usePlaylistCleaner } from '@/features/cleaner/use-playlist-cleaner'
import { cn } from '@/lib/cn'

import { CleanerDuplicateList } from './cleaner-duplicate-list'
import { CleanerIssueList } from './cleaner-issue-list'

export function PlaylistCleanerWorkspace(): JSX.Element {
  const { t } = useTranslation()
  const cleaner = usePlaylistCleaner()

  if (!cleaner.auth.isAuthenticated) {
    return (
      <section className="mx-auto max-w-lg rounded-lg border border-border bg-card p-8 text-center">
        <ShieldAlert className="mx-auto size-10 text-primary" />
        <h2 className="mt-4 font-display text-xl font-extrabold">
          {t('cleaner.connect.title')}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t('cleaner.connect.description')}
        </p>
        <ContinueWithGoogleButton
          label={t('auth.continue')}
          connectingLabel={t('auth.connecting')}
          isSigningIn={cleaner.auth.status === 'signingIn'}
          onSignIn={() => void cleaner.auth.signIn()}
          className="mx-auto mt-6"
        />
      </section>
    )
  }

  if (cleaner.save.status === 'succeeded') {
    return (
      <CopySuccess
        count={cleaner.save.completed}
        destinationId={cleaner.playlist?.id}
        onReset={cleaner.handleStartOver}
        translationPrefix="cleaner"
      />
    )
  }

  const isSaving = cleaner.save.status === 'saving'
  const isScanning = cleaner.loadState.status === 'loading'

  return (
    <>
      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <PlaylistSelect
          label={t('cleaner.playlist')}
          value={cleaner.playlist?.id}
          playlists={cleaner.playlists}
          disabled={cleaner.libraryState.status === 'loading' || isSaving}
          onChange={cleaner.handlePlaylistChange}
        />
        {cleaner.libraryState.error ? (
          <p role="alert" className="px-4 py-3 text-sm text-destructive">
            {t(`errors.youtube.${cleaner.libraryState.error}`)}
          </p>
        ) : null}
      </section>

      {isScanning ? (
        <div className="mx-auto max-w-lg py-24 text-center">
          <RefreshCw className="mx-auto size-10 animate-spin text-primary" />
          <h2 className="mt-5 font-display text-xl font-extrabold">
            {t('cleaner.scan.title')}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('cleaner.scan.description')}
          </p>
        </div>
      ) : cleaner.loadState.status === 'failed' ? (
        <div className="mt-5 rounded-lg border border-border bg-card p-8 text-center">
          <p role="alert" className="text-sm text-destructive">
            {t(`errors.youtube.${cleaner.loadState.error ?? 'unknown'}`)}
          </p>
          <Button className="mt-4" variant="outline" onClick={cleaner.retry}>
            {t('cleaner.retryLoad')}
          </Button>
        </div>
      ) : !cleaner.playlist ? (
        <p className="p-12 text-center text-sm text-muted-foreground">
          {t('cleaner.choose')}
        </p>
      ) : (
        <>
          <div className="mb-5 mt-5 grid gap-3 sm:grid-cols-3">
            {CLEANER_STAT_KEYS.map((statKey) => (
              <div
                key={statKey}
                className="rounded-lg border border-border bg-card p-5"
              >
                <span className="text-sm text-muted-foreground">
                  {t(`cleaner.stats.${statKey}`)}
                </span>
                <b className={cn('mt-2 block text-3xl', CLEANER_STAT_TONES[statKey])}>
                  {cleaner.summary[statKey]}
                </b>
              </div>
            ))}
          </div>

          {cleaner.isClean ? (
            <section className="rounded-lg border border-border bg-card p-10 text-center">
              <Sparkles className="mx-auto size-10 text-primary" />
              <h2 className="mt-4 font-display text-xl font-extrabold">
                {t('cleaner.clean.title')}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('cleaner.clean.description')}
              </p>
              <Button className="mt-5" variant="outline" onClick={cleaner.retry}>
                <RefreshCw />
                {t('cleaner.scanAgain')}
              </Button>
            </section>
          ) : (
            <div className="space-y-5">
              <section className="rounded-lg border border-border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-extrabold">
                      {t('cleaner.duplicates.title')}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t('cleaner.duplicates.description')}
                    </p>
                  </div>
                  <Button variant="outline" onClick={cleaner.retry} disabled={isSaving}>
                    <RefreshCw />
                    {t('cleaner.scanAgain')}
                  </Button>
                </div>
                <div className="mt-5">
                  <CleanerDuplicateList
                    groups={cleaner.groups}
                    keepRules={cleaner.keepRules}
                    onKeepRuleChange={cleaner.handleKeepRuleChange}
                  />
                </div>
              </section>

              <section className="overflow-hidden rounded-lg border border-border bg-card">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
                  <div>
                    <h2 className="font-display text-lg font-extrabold">
                      {t('cleaner.issues.title')}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t('cleaner.issues.description')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={cleaner.issueVideos.length === 0}
                    onClick={cleaner.handleToggleAllIssues}
                  >
                    <CheckSquare />
                    {t(
                      cleaner.allIssuesSelected
                        ? 'cleaner.deselectAll'
                        : 'cleaner.selectAll',
                    )}
                  </Button>
                </div>
                <CleanerIssueList
                  videos={cleaner.issueVideos}
                  selectedIssueIds={cleaner.selectedIssueIds}
                  onToggle={cleaner.handleToggleIssue}
                />
              </section>
            </div>
          )}
        </>
      )}

      {cleaner.plan.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 shadow-2xl backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <span className="min-w-0 flex-1">
              <b className="block text-sm">
                {t('cleaner.pendingChanges', { count: cleaner.plan.length })}
              </b>
              <small className="text-muted-foreground">{t('cleaner.pendingHint')}</small>
            </span>
            <Button
              disabled={isSaving}
              onClick={cleaner.openConfirmDialog}
            >
              {t('cleaner.save')}
            </Button>
          </div>
        </div>
      ) : null}

      {cleaner.isConfirmDialogOpen ? (
        <BuildConfirmDialog
          count={cleaner.plan.length}
          playlistName={cleaner.playlist?.title ?? ''}
          onCancel={cleaner.closeConfirmDialog}
          onConfirm={cleaner.handleConfirmClean}
          translationPrefix="cleaner"
        />
      ) : null}
      <SaveDialog
        progress={cleaner.save}
        onRetry={() => void cleaner.save.retry()}
        onClose={cleaner.handleCloseSaveError}
        translationPrefix="cleaner"
      />
    </>
  )
}
