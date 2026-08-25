import type { IPlaylist } from '@/models/playlist'

/**
 * Narrows playlists to those whose title contains `query`, ignoring case.
 *
 * Pure and synchronous — no I/O and no React — because filtering must never
 * cost a request: `playlists.list` has no title-search parameter, so matching
 * happens over what has already been retrieved (research R2, FR-016).
 *
 * An empty or whitespace-only query returns the input array *itself*, not a
 * copy, so the common "no filter" case allocates nothing and keeps a stable
 * identity for memoised consumers.
 *
 * `toLowerCase()` rather than `toLocaleLowerCase()`: the result must not depend
 * on the interface language, so that switching to Arabic cannot change which
 * playlists a Latin-script query matches.
 */
export function filterPlaylistsByTitle(playlists: IPlaylist[], query: string): IPlaylist[] {
  const needle = query.trim().toLowerCase()

  if (needle === '') {
    return playlists
  }

  return playlists.filter((playlist) => playlist.title.toLowerCase().includes(needle))
}
