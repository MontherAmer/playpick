import { useId } from 'react'
import { useTranslation } from 'react-i18next'

import { NewPlaylistFieldset } from '@/components/create/NewPlaylistFieldset'
import { PlaylistPicker } from '@/components/playlists/PlaylistPicker'
import type { IPlaylist } from '@/models/playlist'
import type { IPlaylistDraft } from '@/models/playlistDraft'
import { cn } from '@/utils/cn'

export type MergeDestinationKind = 'existing' | 'new'

interface MergeDestinationChoiceProps {
  kind: MergeDestinationKind
  onKindChange: (kind: MergeDestinationKind) => void
  existing: IPlaylist | undefined
  onExistingChange: (playlist: IPlaylist) => void
  result: IPlaylistDraft
  onResultChange: (draft: IPlaylistDraft) => void
  disabled?: boolean
}

const OPTIONS: readonly MergeDestinationKind[] = ['existing', 'new']

/**
 * Where the merged videos are going: a playlist that already exists, or one
 * about to be created.
 *
 * A real `fieldset`/`legend` radio group rather than buttons imitating one, so
 * arrow-key navigation and the group semantics a screen reader announces both
 * come free — the treatment `PrivacyChoice` gets, for the same reason.
 *
 * **Switching between the two never touches the source selection or the draft
 * arrangement.** Someone who changes their mind about where the videos go has
 * not changed their mind about the videos or the order they arranged them in.
 *
 * The picker is given **no `excludeId`**: a playlist chosen as the destination
 * stays selectable as a source, which the specification explicitly permits.
 * Nothing special is needed to make that safe — a video taken from the
 * destination is by definition already in it, so the ordinary duplicate
 * detection catches it.
 *
 * ## Why this is still not Build's `DestinationChoice`
 *
 * Build has a component offering the same-looking choice, and generalising it
 * was considered and rejected in feature 008. **Part of that reasoning has since
 * expired**: it argued that the *new playlist* branches rendered different
 * fields, and after feature 009 they render the same `NewPlaylistFieldset`.
 *
 * What is left is a two-option radio group whose two labels differ, wrapped
 * around a picker and a fieldset that are now both shared. That is a genuinely
 * small amount of duplication, and the merge-specific rule it carries — **no
 * `excludeId`**, so a playlist chosen as the destination stays selectable as a
 * source — has no counterpart in Build.
 *
 * The seam, if a third chooser appears: the two labels and the picker's own
 * label become props. It is a task of its own, and smaller now than it was.
 */
export function MergeDestinationChoice({
  kind,
  onKindChange,
  existing,
  onExistingChange,
  result,
  onResultChange,
  disabled = false,
}: MergeDestinationChoiceProps) {
  const { t } = useTranslation()
  const groupName = useId()

  return (
    <div className="flex flex-col gap-3">
      <fieldset disabled={disabled}>
        <legend className="mb-2 text-sm font-medium">{t('merge.destination.legend')}</legend>

        <div className="flex flex-col gap-2">
          {OPTIONS.map((option) => {
            const id = `${groupName}-${option}`

            return (
              <label
                key={option}
                htmlFor={id}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg border p-2.5 text-sm transition-colors',
                  'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
                  kind === option ? 'border-brand bg-brand-muted/40' : 'hover:bg-accent/50',
                  disabled && 'cursor-not-allowed opacity-60',
                )}>
                <input
                  id={id}
                  type="radio"
                  name={groupName}
                  value={option}
                  checked={kind === option}
                  onChange={() => {
                    onKindChange(option)
                  }}
                  className="h-4 w-4 shrink-0 accent-brand"
                />
                {option === 'existing' ? t('merge.destination.existing') : t('merge.destination.new')}
              </label>
            )
          })}
        </div>
      </fieldset>

      {kind === 'existing' ? (
        <div className="max-h-64 overflow-y-auto">
          <PlaylistPicker
            selectedId={existing?.id}
            onSelect={onExistingChange}
            label={t('merge.destination.choose')}
            layout="list"
          />
        </div>
      ) : (
        <NewPlaylistFieldset draft={result} onChange={onResultChange} namespace="merge" disabled={disabled} />
      )}
    </div>
  )
}
