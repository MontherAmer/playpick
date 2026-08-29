import type { IPlaylistItem } from '@/models/playlistItem'

/**
 * One intent to copy one video into the destination playlist.
 *
 * It exists only locally, until a save turns it into a real membership.
 */
export interface IPendingAddition {
  /**
   * Identity of **this intent**, not of the video.
   *
   * Minted fresh per intent and never derived from `item.id`: copying the same
   * video twice must produce two independent additions, and deriving the key
   * from the source membership would collide them into one.
   */
  key: string
  /** The video to add. Several pending additions may legitimately share one. */
  videoId: string
  /**
   * The source item, kept for display.
   *
   * Its `id` names a membership in the **source** playlist and is meaningless
   * in the destination — it must never be sent to YouTube.
   */
  item: IPlaylistItem
  /**
   * Where this addition sits in the destination draft.
   *
   * **Not** the position sent to YouTube. Excluded duplicates are shown in the
   * draft but never added, so a draft index is too large by the number of
   * exclusions above it. The position comes from the final destination instead
   * — see `features/copy/buildCopyPlan.ts`.
   */
  draftIndex: number
  /**
   * The video was already in the destination when this intent was made —
   * either from YouTube or from an earlier addition in the same session.
   *
   * Computed once, at add time, and then frozen. Opting into duplicates later
   * changes what is *sent*, not what was *detected*.
   */
  isDuplicate: boolean
  /**
   * The person dropped this at a particular place, rather than appending it
   * with the copy control.
   *
   * When false no position is sent at all, which appends — the API's own
   * default, and one fewer way for the request to be refused.
   */
  hasChosenPosition: boolean
}

/** One video to add, as it will be sent. */
export interface ICopyStep {
  /** The pending addition this step came from, so a retry can name its remainder. */
  key: string
  videoId: string
  /**
   * Zero-based index in the destination, matching the API's own numbering.
   * Absent when the person expressed no placement.
   */
  position?: number
}
