import type { JSX } from 'react'

import { LoaderCircle, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import type { IBuildSaveState } from '@/models/build.interface'

function DialogFrame({
  title,
  description,
  children,
  onClose,
}: {
  title: string
  description: string
  children: JSX.Element
  onClose?: () => void
}): JSX.Element {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-overlay/70 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-2xl"
      >
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-extrabold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          {onClose ? (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X />
            </Button>
          ) : null}
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  )
}

export function BuildConfirmDialog({
  count,
  playlistName,
  onCancel,
  onConfirm,
  translationPrefix = 'build',
}: {
  count: number
  playlistName: string
  onCancel: () => void
  onConfirm: () => void
  translationPrefix?: 'build' | 'duplicate' | 'merge'
}): JSX.Element {
  const { t } = useTranslation()

  return (
    <DialogFrame
      title={t(`${translationPrefix}.confirm.title`)}
      description={t(`${translationPrefix}.confirm.description`, { count, playlist: playlistName })}
      onClose={onCancel}
    >
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button onClick={onConfirm}>{t(`${translationPrefix}.confirm.action`)}</Button>
      </div>
    </DialogFrame>
  )
}

export function BuildDiscardDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void
  onConfirm: () => void
}): JSX.Element {
  const { t } = useTranslation()

  return (
    <DialogFrame
      title={t('build.discard.title')}
      description={t('build.discard.description')}
      onClose={onCancel}
    >
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button variant="destructive" onClick={onConfirm}>{t('build.discard.action')}</Button>
      </div>
    </DialogFrame>
  )
}

export function BuildProgressDialog({
  state,
  onClose,
  onRetry,
  translationPrefix = 'build',
}: {
  state: IBuildSaveState
  onClose: () => void
  onRetry: () => void
  translationPrefix?: 'build' | 'duplicate' | 'merge'
}): JSX.Element | null {
  const { t } = useTranslation()

  if (state.status === 'idle' || state.status === 'succeeded') return null

  const isBusy = state.status === 'creating' || state.status === 'adding'

  return (
    <DialogFrame
      title={t(
        state.status === 'creating'
          ? `${translationPrefix}.progress.creating`
          : state.status === 'adding'
            ? `${translationPrefix}.progress.adding`
            : `${translationPrefix}.progress.failed`,
      )}
      description={
        state.status === 'adding'
          ? t(`${translationPrefix}.progress.count`, {
              completed: state.completed,
              total: state.total,
            })
          : state.status === 'failed'
            ? t(`errors.youtube.${state.error ?? 'unknown'}`)
            : t(`${translationPrefix}.progress.creatingDescription`)
      }
      onClose={isBusy ? undefined : onClose}
    >
      {isBusy ? (
        <LoaderCircle className="mx-auto size-8 animate-spin text-primary" />
      ) : (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>{t('common.close')}</Button>
          <Button onClick={onRetry}>{t(`${translationPrefix}.progress.retry`)}</Button>
        </div>
      )}
    </DialogFrame>
  )
}
