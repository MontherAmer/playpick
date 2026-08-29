import { useTranslation } from 'react-i18next'

import { PlaylistPicker } from '@/components/playlists/PlaylistPicker'
import type { IPlaylist } from '@/models/playlist'

interface SourcePlaylistColumnProps {
  selectedId: string | undefined
  onSelect: (playlist: IPlaylist) => void
}

/**
 * Which playlist is being browsed for videos.
 *
 * `PlaylistPicker` in its compact layout, so the library read, the search, the
 * pagination and every empty and error state are shared rather than rebuilt in
 * a narrow column. **It issues no retrieval of its own** — mounting it costs
 * nothing beyond what the library already holds.
 *
 * Deliberately **no `excludeId`**. The playlist chosen as the destination stays
 * browsable here: nothing special is needed to make that safe, because a video
 * taken from the destination is by definition already in it and is caught by the
 * same duplicate detection as any other. Copy Between Playlists excludes its
 * source because copying a playlist into itself is meaningless; gathering from a
 * playlist that also happens to be the destination is not.
 */
export function SourcePlaylistColumn({ selectedId, onSelect }: SourcePlaylistColumnProps) {
  const { t } = useTranslation()

  return (
    <section
      aria-label={t('build.yourPlaylists')}
      // `min-w-0`: a grid item defaults to `min-width: auto`, so an
      // intrinsically wide child would push this track wider than its column
      // and scroll the whole page sideways at narrow widths.
      className="flex min-w-0 flex-col rounded-xl border bg-card p-3 shadow-card sm:p-4">
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        {t('build.yourPlaylists')}
      </h2>

      {/* Its own scroll container, never the page: with three lists of
          unbounded length, page-level scrolling would push the draft's save
          control off screen — the one control needed while working here. */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <PlaylistPicker selectedId={selectedId} onSelect={onSelect} label={t('build.yourPlaylists')} layout="list" />
      </div>
    </section>
  )
}
