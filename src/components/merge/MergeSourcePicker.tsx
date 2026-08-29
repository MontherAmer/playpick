import { useTranslation } from 'react-i18next'

import { PlaylistPicker } from '@/components/playlists/PlaylistPicker'
import type { IPlaylist } from '@/models/playlist'

interface MergeSourcePickerProps {
  selectedIds: ReadonlySet<string>
  onToggle: (playlist: IPlaylist) => void
}

/**
 * Which playlists to merge.
 *
 * `PlaylistPicker` in multi-select, so the library read, the title search, the
 * pagination and every empty, loading and error state are shared rather than
 * rebuilt. **It issues no retrieval of its own** — mounting it costs nothing
 * beyond what the library already holds.
 *
 * No `excludeId`: every playlist is a candidate, since a merge has no
 * destination to keep out of its own source list.
 */
export function MergeSourcePicker({ selectedIds, onToggle }: MergeSourcePickerProps) {
  const { t } = useTranslation()

  return (
    // A plain `div`, not a `section`: the picker renders its own labelled
    // region, and wrapping it in a second one would put two landmarks with the
    // same name in the page outline — the defect found in feature 006.
    <div className="flex min-w-0 flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          {t('merge.choosePlaylists')}
        </h2>

        <p aria-live="polite" className="mt-1 text-sm text-muted-foreground">
          {t('merge.selectedCount', { count: selectedIds.size })}
        </p>
      </div>

      <PlaylistPicker
        selectedIds={selectedIds}
        onSelect={onToggle}
        label={t('merge.choosePlaylists')}
        className="min-w-0"
      />
    </div>
  )
}
