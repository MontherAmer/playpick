import { CircleAlert } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'

import type { PlaylistPrivacy } from '@/models/playlist'
import type { FieldIssue } from '@/models/playlistDraft'
import { cn } from '@/utils/cn'

interface PrivacyChoiceProps {
  /** `null` renders no checked option — nothing is assumed on the person's behalf. */
  value: PlaylistPrivacy | null
  onChange: (value: PlaylistPrivacy) => void
  issue?: FieldIssue
  disabled?: boolean
}

const OPTIONS: readonly PlaylistPrivacy[] = ['public', 'unlisted', 'private']

/**
 * Who can see the playlist.
 *
 * A real `fieldset`/`legend` radio group rather than buttons imitating one:
 * arrow-key navigation, group semantics and the "3 of 3" a screen reader
 * announces all come free, and all are expected of a set of exclusive choices.
 *
 * **Nothing is selected until the person selects it.** The approved design starts
 * on public; that is deliberately not carried over, because both defaults decide
 * a visibility on the person's behalf that PlayPick cannot undo for them — it
 * offers no way to edit or delete a playlist once created.
 */
export function PrivacyChoice({ value, onChange, issue, disabled = false }: PrivacyChoiceProps) {
  const { t } = useTranslation()
  const groupName = useId()
  const issueId = useId()

  return (
    <fieldset disabled={disabled} aria-invalid={issue !== undefined} aria-describedby={issue ? issueId : undefined}>
      <legend className="mb-2 text-sm font-medium">
        {t('create.privacy.legend')} <span aria-hidden="true">*</span>
      </legend>

      <div className="flex flex-col gap-2">
        {OPTIONS.map((option) => {
          const id = `${groupName}-${option}`

          return (
            <label
              key={option}
              htmlFor={id}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors',
                'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
                value === option ? 'border-brand bg-brand-muted/40' : 'hover:bg-accent/50',
                disabled && 'cursor-not-allowed opacity-60',
              )}>
              <input
                id={id}
                type="radio"
                name={groupName}
                value={option}
                // No `defaultChecked` anywhere: `null` means nothing is checked.
                checked={value === option}
                onChange={() => {
                  onChange(option)
                }}
                className="h-4 w-4 shrink-0 accent-brand"
              />
              {t(`create.privacy.${option}`)}
            </label>
          )
        })}
      </div>

      {issue && (
        <p id={issueId} role="alert" className="mt-2 inline-flex items-center gap-1.5 text-sm text-destructive">
          <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
          {t('create.privacyRequired')}
        </p>
      )}
    </fieldset>
  )
}
