import type { ChangeEvent, JSX } from 'react'

import { CircleAlert, Image, LoaderCircle, ShieldAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ContinueWithGoogleButton } from '@/components/auth/continue-with-google-button'
import { CopySuccess, DiscardDialog, SaveDialog } from '@/components/copy/copy-dialogs'
import { PlaylistSelect } from '@/components/copy/playlist-select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useRenamePlaylist } from '@/features/rename/use-rename-playlist'
import { getActiveRenamePreset } from '@/features/rename/rename.utils'
import { cn } from '@/lib/cn'
import type { RenameDirection, RenamePresetId } from '@/models/rename.interface'

const PRESET_IDS: readonly RenamePresetId[] = [
  'numberedTitle',
  'lessonNumber',
  'partTitle',
]

export function RenamePlaylistWorkspace(): JSX.Element {
  const { t } = useTranslation()
  const rename = useRenamePlaylist()
  const activePreset = getActiveRenamePreset(rename.pattern)

  if (!rename.auth.isAuthenticated) {
    return (
      <section className="mx-auto max-w-lg rounded-lg border border-border bg-card p-8 text-center">
        <ShieldAlert className="mx-auto size-10 text-primary" />
        <h2 className="mt-4 font-display text-xl font-extrabold">
          {t('rename.connect.title')}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t('rename.connect.description')}
        </p>
        <ContinueWithGoogleButton
          label={t('auth.continue')}
          connectingLabel={t('auth.connecting')}
          isSigningIn={rename.auth.status === 'signingIn'}
          onSignIn={() => void rename.auth.signIn()}
          className="mx-auto mt-6"
        />
      </section>
    )
  }

  if (rename.save.status === 'succeeded') {
    return (
      <CopySuccess
        count={rename.save.completed}
        destinationId={rename.playlist?.id}
        onReset={rename.handleStartOver}
        translationPrefix="rename"
      />
    )
  }

  const isSaving = rename.save.status === 'saving'
  const isLoading =
    rename.loadState.status === 'loading' ||
    rename.libraryState.status === 'loading'

  const handleNumberChange = (
    field: 'startAt' | 'step' | 'padding',
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    rename.updatePattern(field, Number(event.target.value))
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <PlaylistSelect
            label={t('rename.playlist')}
            value={rename.playlist?.id}
            playlists={rename.playlists}
            disabled={rename.libraryState.status === 'loading' || isSaving}
            onChange={rename.handlePlaylistChange}
          />

          <div className="p-5">
            <h2 className="font-display text-lg font-extrabold">
              {t('rename.pattern.title')}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {PRESET_IDS.map((presetId) => (
                <Button
                  key={presetId}
                  size="sm"
                  variant={activePreset === presetId ? 'secondary' : 'outline'}
                  disabled={isSaving}
                  onClick={() => rename.applyPreset(presetId)}
                >
                  {t(`rename.presets.${presetId}`)}
                </Button>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <label className="text-sm font-semibold">
                {t('rename.pattern.prefix')}
                <Input
                  className="mt-2"
                  value={rename.pattern.prefix}
                  disabled={isSaving}
                  onChange={(event) =>
                    rename.updatePattern('prefix', event.target.value)
                  }
                />
              </label>
              <label className="text-sm font-semibold">
                {t('rename.pattern.separator')}
                <Input
                  className="mt-2"
                  value={rename.pattern.separator}
                  disabled={isSaving}
                  onChange={(event) =>
                    rename.updatePattern('separator', event.target.value)
                  }
                />
              </label>
              <label className="text-sm font-semibold">
                {t('rename.pattern.suffix')}
                <Input
                  className="mt-2"
                  value={rename.pattern.suffix}
                  disabled={isSaving}
                  onChange={(event) =>
                    rename.updatePattern('suffix', event.target.value)
                  }
                />
              </label>
              <label className="text-sm font-semibold">
                {t('rename.pattern.startAt')}
                <Input
                  className="mt-2"
                  type="number"
                  min={0}
                  max={9999}
                  value={rename.pattern.startAt}
                  disabled={isSaving}
                  onChange={(event) => handleNumberChange('startAt', event)}
                />
              </label>
              <label className="text-sm font-semibold">
                {t('rename.pattern.step')}
                <Input
                  className="mt-2"
                  type="number"
                  min={1}
                  max={100}
                  value={rename.pattern.step}
                  disabled={isSaving}
                  onChange={(event) => handleNumberChange('step', event)}
                />
              </label>
              <label className="text-sm font-semibold">
                {t('rename.pattern.padding')}
                <Input
                  className="mt-2"
                  type="number"
                  min={1}
                  max={6}
                  value={rename.pattern.padding}
                  disabled={isSaving}
                  onChange={(event) => handleNumberChange('padding', event)}
                />
              </label>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <span className="text-sm">{t('rename.pattern.preserveTitle')}</span>
              <Switch
                checked={rename.pattern.preserveOriginalTitle}
                disabled={isSaving}
                aria-label={t('rename.pattern.preserveTitle')}
                onCheckedChange={(checked) =>
                  rename.updatePattern('preserveOriginalTitle', checked)
                }
              />
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-sm">{t('rename.pattern.direction')}</span>
              <div className="inline-flex rounded-lg bg-muted p-1">
                {(['asc', 'desc'] as const).map((direction: RenameDirection) => (
                  <Button
                    key={direction}
                    size="sm"
                    variant={
                      rename.pattern.direction === direction
                        ? 'secondary'
                        : 'ghost'
                    }
                    disabled={isSaving}
                    onClick={() => rename.updatePattern('direction', direction)}
                  >
                    {t(`rename.pattern.${direction}`)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">
              <CircleAlert className="me-2 inline size-4" />
              <b>{t('rename.warning.title')}</b>
              <p className="mt-1 opacity-80">{t('rename.warning.description')}</p>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between gap-3 border-b border-border p-5">
            <div>
              <h2 className="font-display text-lg font-extrabold">
                {t('rename.preview.title', { count: rename.previewRows.length })}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('rename.preview.description')}
              </p>
            </div>
            {isLoading ? (
              <LoaderCircle className="size-5 animate-spin text-primary" />
            ) : null}
          </div>

          {rename.libraryState.error || rename.loadState.error ? (
            <div className="p-8 text-center">
              <p role="alert" className="text-sm text-destructive">
                {t(
                  `errors.youtube.${rename.loadState.error ?? rename.libraryState.error ?? 'unknown'}`,
                )}
              </p>
              {rename.loadState.error ? (
                <Button className="mt-4" variant="outline" onClick={rename.retry}>
                  {t('rename.retryLoad')}
                </Button>
              ) : null}
            </div>
          ) : rename.previewRows.length === 0 ? (
            <p className="p-12 text-center text-sm text-muted-foreground">
              {t(rename.playlist ? 'rename.empty' : 'rename.choose')}
            </p>
          ) : (
            <div className="max-h-[640px] space-y-2 overflow-y-auto p-4">
              {rename.previewRows.map((row) => (
                <div
                  key={row.video.id}
                  className={cn(
                    'flex items-center gap-3 rounded-md border border-border p-3',
                    row.video.isUnavailable && 'opacity-50',
                  )}
                >
                  {row.video.thumbnailUrl ? (
                    <img
                      src={row.video.thumbnailUrl}
                      alt=""
                      className="h-12 w-20 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <span className="grid h-12 w-20 shrink-0 place-items-center rounded bg-muted">
                      <Image className="size-4 text-muted-foreground" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{row.label}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {row.video.title || t('copy.untitled')}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'hidden shrink-0 rounded-full px-2 py-1 text-[10px] font-bold sm:inline',
                      row.canApply
                        ? 'bg-success-soft text-success'
                        : row.isOwned
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
                    )}
                  >
                    {t(
                      row.video.isUnavailable
                        ? 'rename.status.unavailable'
                        : row.canApply
                          ? 'rename.status.apply'
                          : row.isOwned
                            ? 'rename.status.unchanged'
                            : 'rename.status.labelOnly',
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {rename.playlist ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 shadow-2xl backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <span className="min-w-0 flex-1">
              <b className="block text-sm">
                {t('rename.pendingChanges', { count: rename.pendingCount })}
              </b>
              <small className="text-muted-foreground">
                {t('rename.ownershipSummary', {
                  owned: rename.ownedCount,
                  labels: rename.labelOnlyCount,
                })}
              </small>
            </span>
            <Button
              variant="ghost"
              disabled={rename.pendingCount === 0}
              onClick={rename.openDiscardDialog}
            >
              {t('common.cancel')}
            </Button>
            <Button
              disabled={rename.pendingCount === 0 || isSaving}
              onClick={rename.handleSave}
            >
              {t('rename.save')}
            </Button>
          </div>
        </div>
      ) : null}

      {rename.isDiscardDialogOpen ? (
        <DiscardDialog
          onCancel={rename.closeDiscardDialog}
          onConfirm={rename.handleConfirmDiscard}
          translationPrefix="rename"
        />
      ) : null}
      <SaveDialog
        progress={rename.save}
        onRetry={() => void rename.save.retry()}
        onClose={rename.handleCloseSaveError}
        translationPrefix="rename"
      />
    </>
  )
}
