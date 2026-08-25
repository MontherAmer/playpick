import type { IPlaylist, IPlaylistPage } from '@/models/playlist'

/**
 * Appends a retrieved page to the playlists already held.
 *
 * Pure. Appends in order and never reorders or removes, because "load more"
 * must not disturb what the user is already looking at (FR-007).
 *
 * Incoming playlists whose id is already present are dropped. YouTube paginates
 * by cursor over a collection the user can edit from another tab, so creating a
 * playlist mid-pagination can shift a page boundary and hand back a row already
 * shown. Without this guard that becomes a duplicate React key — a rendering
 * bug for what is really just a stale cursor (data-model invariant 4).
 *
 * The same guard covers a page that repeats an id within itself, which is why
 * ids are recorded as they are accepted rather than only up front.
 *
 * Returns `existing` itself when the page adds nothing, so a redundant append
 * cannot trigger a re-render.
 */
export function appendPlaylistPage(existing: IPlaylist[], page: IPlaylistPage): IPlaylist[] {
  const seen = new Set(existing.map((playlist) => playlist.id))
  const added: IPlaylist[] = []

  for (const playlist of page.playlists) {
    if (seen.has(playlist.id)) continue

    seen.add(playlist.id)
    added.push(playlist)
  }

  return added.length === 0 ? existing : [...existing, ...added]
}
