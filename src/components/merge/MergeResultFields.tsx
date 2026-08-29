import { CircleAlert } from 'lucide-react'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PrivacyChoice } from '@/components/create/PrivacyChoice'
import { validatePlaylistDraft } from '@/features/create/validatePlaylistDraft'
import type { IPlaylistDraft } from '@/models/playlistDraft'
import { cn } from '@/utils/cn'

interface MergeResultFieldsProps {
  draft: IPlaylistDraft
  onChange: (draft: IPlaylistDraft) => void
  disabled?: boolean
}

const FIELD_CLASSES =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60'

/**
 * The playlist the merge will create: a name, an optional description, and who
 * can see it.
 *
 * **Not a `<form>`.** The page's action is *Merge*, and a nested form would
 * swallow Enter and act on the wrong thing. The parts one level down are reused
 * instead — `PrivacyChoice` verbatim, and `validatePlaylistDraft` to decide what
 * is missing — which is what makes the no-default-visibility rule structural
 * rather than a matter of discipline here.
 *
 * **The approved design's blank-name fallback is deliberately not carried
 * over.** It invents a title when the field is left empty; PlayPick can neither
 * rename nor delete a playlist, so an accidentally unnamed one is permanent.
 *
 * Issues appear once a field has been visited and left, rather than only after a
 * submit that the disabled merge control prevents — feature 005's fix.
 */
export function MergeResultFields({ draft, onChange, disabled = false }: MergeResultFieldsProps) {
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
          {t('merge.name')} <span aria-hidden="true">*</span>
        </label>

        <input
          id={titleId}
          type="text"
          value={draft.title}
          disabled={disabled}
          aria-invalid={titleIssue}
          aria-describedby={titleIssue ? titleIssueId : undefined}
          placeholder={t('merge.namePlaceholder')}
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
            {t('merge.required')}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={descriptionId} className="text-sm font-medium">
          {t('merge.description')}{' '}
          <span className="font-normal text-muted-foreground">({t('merge.descriptionOptional')})</span>
        </label>

        <textarea
          id={descriptionId}
          rows={2}
          value={draft.description}
          disabled={disabled}
          placeholder={t('merge.descriptionPlaceholder')}
          onChange={(event) => {
            onChange({ ...draft, description: event.target.value })
          }}
          className={cn(FIELD_CLASSES, 'resize-y')}
        />
      </div>

      {/* Reused verbatim, including rendering nothing checked while the choice
          is unmade and its own required-message. The wrapper carries `onBlur`
          rather than the component taking a new prop: blur bubbles as
          `focusout`, so leaving the group unanswered is caught here. */}
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
