import type { JSX, ReactNode } from 'react'

import { AlertTriangle, CheckCircle2, LoaderCircle, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import type { ISaveProgress } from '@/models/copy.interface'

function Dialog({
  title,
  description,
  children,
  onClose,
}: {
  title: string
  description: string
  children: ReactNode
  onClose?: () => void
}): JSX.Element {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-overlay/70 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="copy-dialog-title"
        aria-describedby="copy-dialog-description"
        className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-2xl"
      >
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <h2 id="copy-dialog-title" className="font-display text-xl font-extrabold">
              {title}
            </h2>
            <p id="copy-dialog-description" className="mt-2 text-sm text-muted-foreground">
              {description}
            </p>
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

export function DiscardDialog({
  onCancel,
  onConfirm,
  translationPrefix = 'copy',
}: {
  onCancel: () => void
  onConfirm: () => void
  translationPrefix?: 'copy' | 'move'
}): JSX.Element {
  const { t } = useTranslation()

  return (
    <Dialog
      title={t(`${translationPrefix}.discard.title`)}
      description={t(`${translationPrefix}.discard.description`)}
      onClose={onCancel}
    >
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button variant="destructive" onClick={onConfirm}>{t(`${translationPrefix}.discard.confirm`)}</Button>
      </div>
    </Dialog>
  )
}

export function DuplicateDialog({
  count,
  onCancel,
  onConfirm,
  translationPrefix = 'copy',
}: {
  count: number
  onCancel: () => void
  onConfirm: (includeDuplicates: boolean) => void
  translationPrefix?: 'copy' | 'move'
}): JSX.Element {
  const { t } = useTranslation()

  return (
    <Dialog
      title={t(`${translationPrefix}.duplicates.title`, { count })}
      description={t(`${translationPrefix}.duplicates.description`)}
      onClose={onCancel}
    >
      <div className="space-y-2">
        <Button className="w-full" onClick={() => onConfirm(false)}>
          {t(`${translationPrefix}.duplicates.skip`)}
        </Button>
        <Button className="w-full" variant="outline" onClick={() => onConfirm(true)}>
          {t(`${translationPrefix}.duplicates.include`)}
        </Button>
      </div>
    </Dialog>
  )
}

export function SaveDialog({
  progress,
  onRetry,
  onClose,
  translationPrefix = 'copy',
}: {
  progress: ISaveProgress
  onRetry: () => void
  onClose: () => void
  translationPrefix?: 'copy' | 'move'
}): JSX.Element | null {
  const { t } = useTranslation()

  if (progress.status === 'idle' || progress.status === 'succeeded') return null

  const isSaving = progress.status === 'saving'

  return (
    <Dialog
      title={t(isSaving ? `${translationPrefix}.saving.title` : `${translationPrefix}.saveFailed.title`)}
      description={
        isSaving
          ? t(`${translationPrefix}.saving.progress`, {
              completed: progress.completed,
              total: progress.total,
            })
          : t(`errors.youtube.${progress.error ?? 'unknown'}`)
      }
      onClose={isSaving ? undefined : onClose}
    >
      {isSaving ? (
        <LoaderCircle className="mx-auto size-8 animate-spin text-primary" />
      ) : (
        <div className="flex items-center justify-end gap-2">
          <AlertTriangle className="me-auto size-6 text-amber-500" />
          <Button variant="outline" onClick={onClose}>{t('common.close')}</Button>
          <Button onClick={onRetry}>{t(`${translationPrefix}.retry`)}</Button>
        </div>
      )}
    </Dialog>
  )
}

export function CopySuccess({
  count,
  destinationId,
  onReset,
  translationPrefix = 'copy',
}: {
  count: number
  destinationId?: string
  onReset: () => void
  translationPrefix?: 'build' | 'copy' | 'merge' | 'move'
}): JSX.Element {
  const { t } = useTranslation()

  return (
    <section className="rounded-lg border border-border bg-card p-8 text-center sm:p-14">
      <CheckCircle2 className="mx-auto size-12 text-success" />
      <h2 className="mt-4 font-display text-2xl font-extrabold">{t(`${translationPrefix}.success.title`)}</h2>
      <p className="mt-2 text-muted-foreground">{t(`${translationPrefix}.success.description`, { count })}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {destinationId ? (
          <a
            href={`https://www.youtube.com/playlist?list=${destinationId}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            {t(`${translationPrefix}.success.openYoutube`)}
          </a>
        ) : null}
        <Button variant="outline" onClick={onReset}>{t(`${translationPrefix}.success.copyMore`)}</Button>
      </div>
    </section>
  )
}
