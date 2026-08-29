import { useId } from 'react'
import { useTranslation } from 'react-i18next'

import { NewPlaylistFields } from '@/components/build/NewPlaylistFields'
import { PlaylistPicker } from '@/components/playlists/PlaylistPicker'
import type { IPlaylist } from '@/models/playlist'
import type { IPlaylistDraft } from '@/models/playlistDraft'
import { cn } from '@/utils/cn'

export type DestinationKind = 'existing' | 'new'

interface DestinationChoiceProps {
  kind: DestinationKind
  onKindChange: (kind: DestinationKind) => void
  existing: IPlaylist | undefined
  onExistingChange: (playlist: IPlaylist) => void
  newPlaylist: IPlaylistDraft
  onNewPlaylistChange: (draft: IPlaylistDraft) => void
  disabled?: boolean
}

const OPTIONS: readonly DestinationKind[] = ['existing', 'new']

/**
 * Where the gathered videos are going: a playlist that already exists, or one
 * about to be created.
 *
 * A real `fieldset`/`legend` radio group rather than buttons imitating one —
 * arrow-key navigation and the group semantics a screen reader announces both
 * come free, and they are expected of a set of exclusive choices. The same
 * treatment `PrivacyChoice` gets, for the same reason.
 *
 * **Switching between the two never touches the draft.** The destination and
 * the gathered videos are independent, and someone who changes their mind about
 * where the videos go has not changed their mind about the videos.
 *
 * The picker is given **no `excludeId`**: a playlist chosen as the destination
 * stays browsable as a source. Nothing special is needed to make that safe,
 * because a video taken from the destination is by definition already in it and
 * is caught by the ordinary duplicate detection.
 */
export function DestinationChoice({
  kind,
  onKindChange,
  existing,
  onExistingChange,
  newPlaylist,
  onNewPlaylistChange,
  disabled = false,
}: DestinationChoiceProps) {
  const { t } = useTranslation()
  const groupName = useId()

  return (
    <div className="flex flex-col gap-3">
      <fieldset disabled={disabled}>
        <legend className="mb-2 text-sm font-medium">{t('build.chooseDestination')}</legend>

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
                {option === 'existing' ? t('build.useExisting') : t('build.useNew')}
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
            label={t('build.chooseExisting')}
            layout="list"
          />
        </div>
      ) : (
        <NewPlaylistFields draft={newPlaylist} onChange={onNewPlaylistChange} disabled={disabled} />
      )}
    </div>
  )
}
