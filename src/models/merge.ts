import type { YouTubeErrorCode } from '@/api/youtube/errors'
import type { IPlaylist } from '@/models/playlist'
import type { IPlaylistItem } from '@/models/playlistItem'

/**
 * How much is known about one selected playlist.
 *
 * The distinction between `'read'` and everything else is load-bearing, and is
 * the quietest hazard in this feature: a playlist that has not been read and one
 * that is genuinely empty **both hold zero items**. Treating them alike would
 * merge on a total that is silently too small, producing a playlist missing
 * videos the person explicitly selected — and PlayPick can neither remove a
 * video from a playlist nor delete one, so there would be no way back.
 */
export type MergeSourceStatus = 'pending' | 'reading' | 'read' | 'failed'

/** One selected playlist, and what is known about its contents. */
export interface IMergeSource {
  playlist: IPlaylist
  status: MergeSourceStatus
  /**
   * Meaningful **only** when `status` is `'read'`.
   *
   * Empty at every other status, and never a stand-in for "nothing in it" —
   * see `MergeSourceStatus`.
   */
  items: IPlaylistItem[]
  error: YouTubeErrorCode | null
}

/**
 * One video in the arranged merge draft.
 *
 * The draft's order is **held state** from feature 008 onward, so reconciliation
 * has to decide whether a video in the freshly read sources is already in the
 * draft. That decision needs an identity that survives a re-read and separates
 * things that are genuinely different, and `id` is that identity.
 *
 * Three obvious alternatives all fail:
 *
 * - `videoId` — one playlist may hold the same video twice, and both copies are
 *   separate entries; keying on the video would collapse them into one.
 * - **a minted key** — a re-read produces new objects for the same real
 *   memberships, so every entry would look new and the arrangement would be
 *   rebuilt on every refresh.
 * - `itemId` alone — playlist-item ids are unique *per playlist*, not globally,
 *   so two sources could collide.
 *
 * Hence `sourcePlaylistId + itemId`, which is stable across re-reads,
 * distinguishes two copies within one playlist, and distinguishes the same video
 * taken from two different playlists.
 *
 * Note the deliberate contrast with feature 006's `IBuildEntry`, whose key **is**
 * minted: Build's draft is assembled by repeated deliberate additions, so each
 * addition is its own thing. Merge's draft is whatever the sources contain, so
 * its identity has to come from the sources.
 */
export interface IMergeEntry {
  /** `sourcePlaylistId + itemId`. Stable across re-reads. See above. */
  id: string
  /** The playlist this entry was taken from. */
  sourcePlaylistId: string
  /** The playlist-item id within that source. Not unique across playlists. */
  itemId: string
  /** The video this entry points at. Not unique within the draft. */
  videoId: string
  /** The membership itself, for rendering. */
  item: IPlaylistItem
}

/**
 * What the current selection adds up to.
 *
 * Every count comes from one pass of `buildMergePlan`, never from a second
 * computation, so the number in the summary, the number in the confirmation and
 * the total on the progress dialog cannot disagree.
 */
export interface IMergeSummary {
  playlistCount: number
  /** Every available video across every read source, before de-duplication. */
  totalVideos: number
  /** Videos dropped as repeats under the current duplicate setting. */
  duplicateCount: number
  /** Videos dropped because they are deleted or private. */
  unavailableCount: number
  /** What will actually be added — the plan's length, and nothing else. */
  willAddCount: number
  /**
   * At least one source is still `'pending'` or `'reading'`, so every count
   * above is provisional and must be shown as such.
   */
  isCounting: boolean
  /**
   * Sources whose contents could not be read.
   *
   * Non-empty **blocks the merge**. There is no honest way to proceed on input
   * that is partly unknown.
   */
  failedSources: IPlaylist[]
  /** At or above the threshold where a merge consumes most of the day's allowance. */
  isLargeMerge: boolean
  /**
   * Of `duplicateCount`, how many were already in the chosen existing
   * destination. Zero when the destination is a new playlist.
   *
   * `duplicateCount` continues to mean **all** duplicates — across sources and
   * against the destination — because they sit under one opt-in and one number.
   * This figure is reported alongside it so someone can see *why* the count fell
   * when they chose a destination.
   */
  destinationDuplicateCount: number
  /**
   * The chosen destination's contents are not known yet, so every count above is
   * provisional in the same way `isCounting` makes them provisional.
   *
   * Merging must not proceed while this is true: an unknown destination means an
   * unknown duplicate count, and videos already there would be added again.
   */
  isDestinationCounting: boolean
}
