import { CircleAlert } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'

interface DuplicateNoticeProps {
  /** How many videos will actually be added. */
  willAdd: number
  /** How many pending additions are already in the destination. */
  duplicateCount: number
  includeDuplicates: boolean
  onIncludeDuplicatesChange: (value: boolean) => void
}

/**
 * What was detected, and the one decision it leaves the person.
 *
 * Shown only when duplicates were actually found. Its wording never says a
 * duplicate is forbidden — the person may well want a video twice — only that
 * it will not happen unless they ask, which is the difference between a tool
 * that is careful and one that is opinionated.
 */
export function DuplicateNotice({
  willAdd,
  duplicateCount,
  includeDuplicates,
  onIncludeDuplicatesChange,
}: DuplicateNoticeProps) {
  const { t } = useTranslation()
  const toggleId = useId()

  if (duplicateCount === 0) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-lg border bg-muted/40 p-3 text-sm">
      <p className="flex items-center gap-2">
        <CircleAlert className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />

        <span>
          <span className="font-semibold">{t('copy.willAdd', { count: willAdd })}</span>
          {' · '}
          <span className="text-muted-foreground">{t('copy.duplicatesFound', { count: duplicateCount })}</span>
        </span>
      </p>

      <label htmlFor={toggleId} className="flex cursor-pointer items-center gap-2">
        <input
          id={toggleId}
          type="checkbox"
          checked={includeDuplicates}
          onChange={(event) => {
            onIncludeDuplicatesChange(event.target.checked)
          }}
          className="h-4 w-4 rounded border-input accent-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        />
        {t('copy.includeDuplicates')}
      </label>
    </div>
  )
}
