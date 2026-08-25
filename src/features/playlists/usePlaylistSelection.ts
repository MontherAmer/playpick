import { useCallback, useMemo, useState } from 'react'

import type { IPlaylist } from '@/models/playlist'

export interface IPlaylistSelection {
  selectedId: string | undefined
  /** The whole playlist, so a caller can act on it without re-reading the library. */
  selected: IPlaylist | undefined
  /** Replaces any previous choice. Selection never accumulates. */
  select(playlist: IPlaylist): void
  clear(): void
}

/**
 * Holds the playlist chosen on one selection surface.
 *
 * Instances are independent, which is the whole point: a feature needing two
 * playlists calls this twice and owns the relationship between them itself.
 * Nothing here knows about roles, ordering, or whether a pair is valid — those
 * belong to the feature composing the selections, not to selection itself.
 *
 * The selected playlist is a snapshot taken at selection time. If it is renamed
 * or deleted on YouTube afterwards, that surfaces when a tool acts on it rather
 * than being reconciled here.
 */
export function usePlaylistSelection(): IPlaylistSelection {
  const [selected, setSelected] = useState<IPlaylist | undefined>(undefined)

  const select = useCallback((playlist: IPlaylist) => {
    setSelected(playlist)
  }, [])

  const clear = useCallback(() => {
    setSelected(undefined)
  }, [])

  return useMemo(
    () => ({
      selectedId: selected?.id,
      selected,
      select,
      clear,
    }),
    [selected, select, clear],
  )
}
