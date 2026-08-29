import { CircleAlert } from 'lucide-react'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PrivacyChoice } from '@/components/create/PrivacyChoice'
import { validatePlaylistDraft } from '@/features/create/validatePlaylistDraft'
import type { IPlaylistDraft } from '@/models/playlistDraft'
import { cn } from '@/utils/cn'

interface NewPlaylistFieldsProps {
  draft: IPlaylistDraft
  onChange: (draft: IPlaylistDraft) => void
  disabled?: boolean
}

const FIELD_CLASSES =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60'

/**
 * The playlist about to be created: a name, an optional description, and who
 * can see it.
 *
 * **Not a `<form>`, deliberately.** `PlaylistForm` is one, and reusing it here
 * would nest a form inside the build page's own submit flow — invalid markup
 * whose inner submit would swallow Enter and act on the wrong thing. The parts
 * one level down are reused instead: `PrivacyChoice` verbatim, and
 * `validatePlaylistDraft` to decide what is missing.
 *
 * That shared validator is what makes the no-default-visibility rule structural
 * rather than a matter of discipline: a build with no visibility chosen cannot
 * be saved for exactly the same reason a Create Playlist with none cannot be
 * submitted.
 *
 * Issues appear once a field has been **visited and left** rather than only
 * after a submit attempt — the save control is unavailable while the draft is
 * incomplete, so "tell them when they try to submit" would never fire for the
 * one person who most needs to be told what is missing.
 */
export function NewPlaylistFields({ draft, onChange, disabled = false }: NewPlaylistFieldsProps) {
  const { t } = useTranslation()

  const titleId = useId()
  const titleIssueId = useId()
  const descriptionId = useId()

  const [visited, setVisited] = useState<{ title?: boolean; privacy?: boolean }>({})

  const issues = validatePlaylistDraft(draft)
  const titleIssue = issues.title !== undefined && visited.title === true
  const privacyIssue = issues.privacy !== undefined && visited.privacy === true

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor={titleId} className="text-sm font-medium">
          {t('build.name')} <span aria-hidden="true">*</span>
        </label>

        <input
          id={titleId}
          type="text"
          value={draft.title}
          disabled={disabled}
          aria-invalid={titleIssue}
          aria-describedby={titleIssue ? titleIssueId : undefined}
          placeholder={t('build.namePlaceholder')}
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
            {t('build.required')}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={descriptionId} className="text-sm font-medium">
          {t('build.description')}{' '}
          <span className="font-normal text-muted-foreground">({t('build.descriptionOptional')})</span>
        </label>

        <textarea
          id={descriptionId}
          rows={2}
          value={draft.description}
          disabled={disabled}
          placeholder={t('build.descriptionPlaceholder')}
          onChange={(event) => {
            onChange({ ...draft, description: event.target.value })
          }}
          className={cn(FIELD_CLASSES, 'resize-y')}
        />
      </div>

      {/* Reused verbatim, including rendering nothing checked while the choice
          is unmade and its own "choose who can see this" message — that wording
          belongs to the control, not to this page, so it is not overridden.

          The wrapper carries `onBlur` rather than the component taking a new
          prop: blur bubbles as `focusout`, so leaving the group without choosing
          is caught here and feature 005's component stays untouched. */}
      <div
        onBlur={() => {
          setVisited((current) => ({ ...current, privacy: true }))
        }}>
        <PrivacyChoice
          value={draft.privacy}
          issue={privacyIssue ? issues.privacy : undefined}
          disabled={disabled}
          onChange={(privacy) => {
            onChange({ ...draft, privacy })
          }}
        />
      </div>
    </div>
  )
}
