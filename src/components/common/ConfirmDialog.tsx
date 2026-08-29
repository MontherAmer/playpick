import { useEffect, useId, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/Button'

interface ConfirmDialogProps {
  open: boolean
  /** Already translated by the caller — this component holds no keys of its own. */
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

const FOCUSABLE = 'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * A confirmation before something that cannot be undone.
 *
 * A real modal, and deliberately so: focus moves in, is **trapped** while open,
 * and returns to whatever opened it. That is the opposite of the header's
 * disclosure menus, and correctly — a disclosure is something you may ignore,
 * a confirmation is a question that has to be answered before anything else.
 *
 * The destructive control is never the default focus target, so an accidental
 * Enter cancels rather than destroys.
 */
export function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  const { t } = useTranslation()
  const titleId = useId()
  const messageId = useId()
  const panelRef = useRef<HTMLDivElement | null>(null)
  const openerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return

    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null

    // The first focusable element is Cancel, by DOM order. Focusing it rather
    // than the destructive control means a reflexive Enter cancels.
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()

        return
      }

      if (event.key !== 'Tab') return

      const panel = panelRef.current

      if (!panel) return

      const focusable = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)]

      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      // Wrap at both ends, so Tab can never leave the dialog while it is open.
      if (event.shiftKey && (active === first || !panel.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    const opener = openerRef.current

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      opener?.focus()
    }
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Pressing the backdrop cancels — the non-destructive direction. */}
      <div className="absolute inset-0 bg-foreground/40" onClick={onCancel} aria-hidden="true" />

      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        className="relative w-full max-w-sm rounded-xl border bg-card p-5 shadow-elevated">
        <h2 id={titleId} className="text-base font-semibold">
          {title}
        </h2>

        <p id={messageId} className="mt-2 text-sm text-muted-foreground">
          {message}
        </p>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            {t('confirm.cancel')}
          </Button>

          <Button variant="brand" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
