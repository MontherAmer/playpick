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
}
