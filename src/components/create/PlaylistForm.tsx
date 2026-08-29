import { CircleAlert, Info, ListPlus, Loader2 } from 'lucide-react'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PrivacyChoice } from '@/components/create/PrivacyChoice'
import { Button } from '@/components/ui/Button'
import type { IDraftIssues, IPlaylistDraft } from '@/models/playlistDraft'
import { cn } from '@/utils/cn'

interface PlaylistFormProps {
  draft: IPlaylistDraft
  /** Every current issue. Which of them are *shown* is decided here — see below. */
  issues: IDraftIssues
  /** Shows every issue at once, regardless of what has been visited. */
  forceShowIssues: boolean
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
export function PlaylistForm({
  draft,
  issues,
  forceShowIssues,
  canSubmit,
  isSubmitting,
  onChange,
  onSubmit,
}: PlaylistFormProps) {
  const { t } = useTranslation()
  const titleId = useId()
  const titleIssueId = useId()
  const descriptionId = useId()

  /**
   * Which fields the person has visited and left.
   *
   * The submit control is unavailable while the draft is invalid (FR-007), so
   * "report it when they try to submit" would never fire for someone who has not
   * yet filled the form in — the one person who most needs to be told what is
   * missing. Reporting on leaving a field gives them that, without marking a
   * form invalid before they have had a chance to fill it in.
   */
  const [visited, setVisited] = useState<{ title?: boolean; privacy?: boolean }>({})

  /**
   * A rejection by YouTube is always shown: it is the answer to something they
   * already did, not a prompt about something they have not done yet.
   */
  const shows = (field: 'title' | 'privacy') =>
    issues[field] !== undefined && (forceShowIssues || visited[field] === true || issues[field] === 'rejectedByYouTube')

  const titleIssue = shows('title') ? issues.title : undefined
  const privacyIssue = shows('privacy') ? issues.privacy : undefined

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
          aria-invalid={titleIssue !== undefined}
          aria-describedby={titleIssue ? titleIssueId : undefined}
          placeholder={t('create.namePlaceholder')}
          onChange={(event) => {
            onChange({ ...draft, title: event.target.value })
          }}
          onBlur={() => {
            setVisited((current) => ({ ...current, title: true }))
          }}
          className={cn(FIELD_CLASSES, titleIssue && 'border-destructive')}
        />

        {titleIssue && (
          <p id={titleIssueId} role="alert" className="inline-flex items-center gap-1.5 text-sm text-destructive">
            <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t(titleIssue === 'rejectedByYouTube' ? 'create.errors.invalidPlaylistDetails' : 'create.required')}
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
        issue={privacyIssue}
        disabled={isSubmitting}
        onChange={(privacy) => {
          onChange({ ...draft, privacy })
        }}
        onBlur={() => {
          setVisited((current) => ({ ...current, privacy: true }))
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
