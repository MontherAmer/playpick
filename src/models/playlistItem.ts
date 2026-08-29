/**
 * One video's *membership* of a playlist — not the video itself.
 *
 * The distinction is load-bearing: YouTube permits the same video to appear
 * twice in one playlist, so `videoId` is not unique here and must never be used
 * to key, dedupe, or match an item. `id` is.
 *
 * There is deliberately no `position` field. Order is the item's index in
 * whichever array holds it, so a single array is the one source of truth and
 * the two representations can never disagree.
 */
export interface IPlaylistItem {
  /** The playlist-item id, unique to this membership. React key, and the id sent on update. */
  id: string
  /** The video this membership points at. Not unique within a playlist. */
  videoId: string
  /** The video's title, or YouTube's placeholder once it is gone. */
  title: string
  /** The channel that uploaded the video — not the playlist owner's. */
  channelTitle?: string
  /** Absent for unavailable videos, and for anything YouTube gives no thumbnail. */
  thumbnailUrl?: string
  /**
   * Whole seconds. Retrieved separately and purely decorative, so absence is
   * normal rather than a failure — the badge is simply not drawn.
   */
  durationSeconds?: number
  /**
   * The video behind this membership is deleted or private. The membership is
   * still real: it keeps its place in the running order and stays movable.
   */
  isUnavailable: boolean
}

/**
 * One position change to send to YouTube.
 *
 * A plan of these is derived from the draft, never stored — see
 * `features/reorder/buildMovePlan.ts`, which also fixes the order they must be
 * applied in.
 */
export interface IMove {
  /** The playlist-item to move. */
  id: string
  /** Zero-based target index, matching the API's own numbering. */
  toPosition: number
}
