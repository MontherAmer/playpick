import type { IBuildStep } from '@/models/build'

/**
 * What a duplicate will produce.
 *
 * Returned by `buildDuplicatePlan` in a single pass, so the number shown in the
 * summary, the number quoted in the confirmation and the total on the progress
 * dialog all come from one computation and cannot disagree.
 */
export interface IDuplicatePlan {
  /** What will be added, in the source's order, with every repeat intact. */
  steps: IBuildStep[]
  /** Every item retrieved from the source, copyable or not. */
  totalItems: number
  /** Items whose video is deleted or private, and so cannot be added. */
  unavailableCount: number
  /**
   * How many steps are a second-or-later occurrence of a video already in the
   * plan.
   *
   * **Reported, never acted on.** Copy, Build and Merge would each drop these;
   * this tool keeps them, because a playlist holding a video three times is a
   * playlist holding it three times. The count exists so the interface can say
   * so before anyone confirms — a faithful copy should be expected rather than
   * a surprise.
   */
  repeatedCount: number
}

/** What the person is told about the duplicate before they confirm it. */
export interface IDuplicateSummary {
  totalItems: number
  /** What will actually be added — the plan's length, and nothing else. */
  copyableCount: number
  unavailableCount: number
  /** See `IDuplicatePlan.repeatedCount`. Reported, never acted on. */
  repeatedCount: number
  /**
   * The source has not been retrieved in full, so every count above is
   * provisional and duplicating must wait.
   *
   * Planning from a partial retrieval would produce a copy that is silently
   * short, and PlayPick can neither delete a playlist nor remove a video from
   * one — so there would be no way back.
   */
  isLoading: boolean
  /**
   * Nothing can be copied: the source is empty, or every video in it is
   * unavailable.
   *
   * Named rather than left as a comparison at three call sites, because it
   * drives a refusal and a refusal deserves a name.
   */
  hasNothingToCopy: boolean
  /** At or above the threshold where one duplicate consumes most of the day's allowance. */
  isLargeDuplicate: boolean
}
