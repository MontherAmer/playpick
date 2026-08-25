import { createContext } from 'react'

import type { YouTubeErrorCode } from '@/api/youtube/errors'
import type { IPlaylist } from '@/models/playlist'

/** State of the **first** page only. A later page failing never moves this off `ready`. */
export type PlaylistLibraryStatus = 'idle' | 'loading' | 'ready' | 'error'

/**
 * The playlists retrieved so far for the connected account, shared by every
 * selection surface so returning to one does not pay for the library again.
 *
 * Presentation state lives with each surface, not here: this describes what has
 * been retrieved, never what is filtered or selected.
 */
export interface IPlaylistLibrary {
  /** Everything retrieved so far, in the order the API returned it. */
  playlists: IPlaylist[]
  status: PlaylistLibraryStatus
  /** Fatal: the first page failed and there is nothing to show. */
  error: YouTubeErrorCode | null
  /** Whether unretrieved playlists remain. Derived from the page cursor, which stays internal. */
  hasMore: boolean
  /** Library size as reported by the API, which may exceed `playlists.length`. */
  totalResults: number
  /**
   * Retrieves the first page. Idempotent, and called by `usePlaylistLibrary` on
   * first consume rather than by components — retrieval is lazy so a mounted
   * provider with no consumer costs nothing.
   */
  loadFirstPage(): void
  /** Discards everything and re-retrieves from the first page. */
  refresh(): void
}

export const PlaylistLibraryContext = createContext<IPlaylistLibrary | null>(null)
