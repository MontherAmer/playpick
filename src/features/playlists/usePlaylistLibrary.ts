import { useContext, useEffect } from 'react'

import { PlaylistLibraryContext, type IPlaylistLibrary } from '@/features/playlists/PlaylistLibraryContext'

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
