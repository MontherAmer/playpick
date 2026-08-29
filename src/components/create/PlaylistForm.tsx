import { CircleAlert, Info, ListPlus, Loader2 } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'

import { PrivacyChoice } from '@/components/create/PrivacyChoice'
import { Button } from '@/components/ui/Button'
import type { IDraftIssues, IPlaylistDraft } from '@/models/playlistDraft'
import { cn } from '@/utils/cn'

interface PlaylistFormProps {
  draft: IPlaylistDraft
  /** Only the issues that should currently be shown — see the page's timing rule. */
  issues: IDraftIssues
  /** Whether the draft could be submitted at all, regardless of what is displayed. */
  canSubmit: boolean
  isSubmitting: boolean
  onChange: (draft: IPlaylistDraft) => void
  onSubmit: () => void
}

const FIELD_CLASSES =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60'

/**
 * The three fields, their labels, and the one sentence that says what the button
 * will do.
 *
 * A real `<form>`, so Enter submits — which is why the submission itself is
 * guarded against repeating rather than merely disabled.
 *
 * Every field has a real `<label>` bound by `htmlFor`. A placeholder is a hint,
 * never a label: it disappears at the first keystroke and is not an accessible
 * name.
 */
export function PlaylistForm({ draft, issues, canSubmit, isSubmitting, onChange, onSubmit }: PlaylistFormProps) {
  const { t } = useTranslation()
  const titleId = useId()
  const titleIssueId = useId()
  const descriptionId = useId()

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
      className="flex flex-col gap-5 rounded-xl border bg-card p-4 shadow-card sm:p-6">
      <div className="flex flex-col gap-2">
        <label htmlFor={titleId} className="text-sm font-medium">
          {t('create.name')} <span aria-hidden="true">*</span>
        </label>

        <input
          id={titleId}
          type="text"
          value={draft.title}
          disabled={isSubmitting}
          required
          aria-invalid={issues.title !== undefined}
          aria-describedby={issues.title ? titleIssueId : undefined}
          placeholder={t('create.namePlaceholder')}
          onChange={(event) => {
            onChange({ ...draft, title: event.target.value })
          }}
          className={cn(FIELD_CLASSES, issues.title && 'border-destructive')}
        />

        {issues.title && (
          <p id={titleIssueId} role="alert" className="inline-flex items-center gap-1.5 text-sm text-destructive">
            <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t('create.required')}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={descriptionId} className="text-sm font-medium">
          {t('create.description')}{' '}
          <span className="font-normal text-muted-foreground">({t('create.descriptionOptional')})</span>
        </label>

        <textarea
          id={descriptionId}
          rows={3}
          value={draft.description}
          disabled={isSubmitting}
          placeholder={t('create.descriptionPlaceholder')}
          onChange={(event) => {
            onChange({ ...draft, description: event.target.value })
          }}
          className={cn(FIELD_CLASSES, 'resize-y')}
        />
      </div>

      <PrivacyChoice
        value={draft.privacy}
        issue={issues.privacy}
        disabled={isSubmitting}
        onChange={(privacy) => {
          onChange({ ...draft, privacy })
        }}
      />

      {/* Immediately before the control, so it is the last thing read before
          committing. A statement, not a dialog: submitting is already
          deliberate, and a dialog on top of that only teaches people to dismiss
          dialogs. */}
      <p className="inline-flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        {t('create.accountNotice')}
      </p>

      <div className="flex justify-end">
        <Button type="submit" variant="brand" disabled={!canSubmit || isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ListPlus className="h-4 w-4" aria-hidden="true" />
          )}
          {isSubmitting ? t('create.submitting') : t('create.submit')}
        </Button>
      </div>
    </form>
  )
}
