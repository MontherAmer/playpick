/**
 * Visibility of a playlist on YouTube.
 *
 * Closed union: the API layer narrows an unrecognised or missing value to
 * `'private'`, since mislabelling a private playlist as public is the harmful
 * direction to get wrong.
 */
export type PlaylistPrivacy = 'public' | 'unlisted' | 'private'

/** A playlist owned by the connected user. */
export interface IPlaylist {
  /** YouTube playlist id. Unique within the library; used as the React key. */
  id: string
  /**
   * Never trusted for uniqueness — two playlists may legitimately share a
   * title, so they stay distinguishable by their other visible attributes.
   */
  title: string
  description?: string
  thumbnailUrl?: string
  /** Zero is valid: an empty playlist is still selectable. */
  itemCount: number
  privacy: PlaylistPrivacy
}

/**
 * One page of the user's library, as returned by a single retrieval.
 *
 * The library is retrieved incrementally so playlists are selectable before the
 * whole library has arrived.
 */
export interface IPlaylistPage {
  playlists: IPlaylist[]
  /** Cursor for the next page. Absent once the last page has been reached. */
  nextPageToken?: string
  /** Total playlists in the library, which may exceed those retrieved so far. */
  totalResults: number
}
