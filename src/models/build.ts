import type { IPlaylist } from '@/models/playlist'
import type { IPlaylistDraft } from '@/models/playlistDraft'
import type { IPlaylistItem } from '@/models/playlistItem'

/**
 * One intended addition to the playlist being built.
 *
 * It exists only locally. Nothing reaches YouTube until a save runs, and a save
 * runs only after an explicit confirmation.
 */
export interface IBuildEntry {
  /**
   * Identity of **this intent**, not of the video and not of its membership.
   *
   * Minted fresh per addition. Deriving it from `item.id` would collide the same
   * source membership added twice; deriving it from `videoId` would collide the
   * same video taken from two different playlists. Both collisions break the
   * same requirement: each addition is independent, so a video may be added more
   * than once and removing one occurrence must leave the others.
   */
  key: string
  /** The video to add. Several entries may legitimately share one. */
  videoId: string
  /**
   * The source membership, kept for display.
   *
   * Its `id` names a membership in the **source** playlist. It is meaningless in
   * the destination and must never be sent to YouTube.
   */
  item: IPlaylistItem
  /** Which playlist it was taken from, so a draft gathered from several can say. */
  sourcePlaylistId: string
}

/**
 * Where the draft is going.
 *
 * A union rather than a pair of optional fields: the two cases differ in what
 * must be true before saving, and in what saving actually does. An existing
 * playlist is added to; a new one has to be created first, and that creation
 * must happen exactly once however many times the additions are retried.
 */
export type IBuildDestination = { kind: 'existing'; playlist: IPlaylist } | { kind: 'new'; draft: IPlaylistDraft }

/**
 * One addition, as it will be sent.
 *
 * **There is deliberately no `position`.** Build always appends — to a playlist
 * it has just created, or to the end of an existing one whose order must be
 * preserved — so adding in draft order reproduces the draft exactly. Omitting
 * the field is also strictly safer: a position is the one part of an insert
 * request that can be refused for being out of range, and a request that never
 * carries one cannot fail that way.
 *
 * `key` is carried so a retry can name precisely what is left.
 */
export interface IBuildStep {
  key: string
  videoId: string
}
