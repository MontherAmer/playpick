import { useContext, useEffect } from 'react'

import { PlaylistLibraryContext, type IPlaylistLibrary } from '@/features/playlists/PlaylistLibraryContext'
import type { IPlaylist } from '@/models/playlist'

export function usePlaylistLibrary(): IPlaylistLibrary {
  const library = useContext(PlaylistLibraryContext)

  if (!library) {
    throw new Error('usePlaylistLibrary must be used inside a <PlaylistLibraryProvider>')
  }

  const { status, loadFirstPage } = library

  /**
   * Consuming the library is what triggers its retrieval, so a mounted provider
   * with nothing displaying playlists costs no quota.
   *
   * Keyed on `status` as well as the callback: `loadFirstPage` keeps a stable
   * identity, so an effect watching it alone would never re-fire if the library
   * were reset back to `idle` while consumers stayed mounted.
   */
  useEffect(() => {
    if (status === 'idle') {
      loadFirstPage()
    }
  }, [status, loadFirstPage])

  return library
}

/**
 * The library's insertion point **without consuming the library**, so no
 * retrieval is triggered.
 *
 * Creating a playlist must not pay for a library it never displays: opening the
 * tool issues no request, and none becomes owed merely because a playlist might
 * later be inserted. Handing back only the inserter is what keeps that true —
 * there is nothing here to read, so nothing to render, so no reason to retrieve.
 *
 * When the library has not been retrieved at all, the insertion is still
 * harmless: it prepends to an empty list that a later first page replaces
 * outright, and that page already contains the playlist. It appears once either
 * way.
 */
export function useAddCreatedPlaylist(): (playlist: IPlaylist) => void {
  const library = useContext(PlaylistLibraryContext)

  if (!library) {
    throw new Error('useAddCreatedPlaylist must be used inside a <PlaylistLibraryProvider>')
  }

  return library.addCreatedPlaylist
}
