import type { IBuildStep } from '@/models/build'
import type { IMergeEntry } from '@/models/merge'

export interface IMergePlan {
  steps: IBuildStep[]
  /** Entries handed in, before de-duplication. Reconciliation has already dropped unavailable videos. */
  totalVideos: number
  /** **All** repeats — against an earlier entry and against the destination alike. */
  duplicateCount: number
  /** Of `duplicateCount`, how many were already in the chosen existing destination. */
  destinationDuplicateCount: number
}

/**
 * Where a merge stops being a personal decision and becomes a deployment-wide
 * one.
 *
 * The daily YouTube allowance is 10,000 units for the **whole deployment** and
 * an insert costs 50, so the day holds roughly **200 writes**. A merge of 100
 * videos is half of that — for every user of PlayPick, not just the person
 * doing it. That is the point at which they deserve to be told.
 *
 * A named constant rather than a number sprinkled through the interface, so a
 * better figure can replace it in one place.
 */
export const LARGE_MERGE_THRESHOLD = 100

/** Unique per emitted step, and deliberately unrelated to any video or membership id. */
let nextKey = 0

function mintKey(): string {
  nextKey += 1

  return `merge-${String(nextKey)}`
}

/**
 * What to add to the merged playlist, in the order to add it.
 *
 * ## It consumes an order rather than deriving one
 *
 * Through feature 007 this function walked the sources itself, so the order and
 * the counts both fell out of the selection and nothing could drift. From
 * feature 008 the order is held state — that is what lets someone rearrange it —
 * so the walk happens in `reconcileMergeDraft` and this function is handed the
 * result.
 *
 * The two-argument form was **replaced rather than kept alongside**: there is
 * exactly one call site, and an overload would let the old derived-order path
 * survive by accident, which is precisely the bug the change exists to prevent.
 *
 * Reconciliation has already excluded unavailable videos, so there is no
 * filtering left to do here — the entries are what will be considered, in the
 * order they will be added.
 *
 * ## De-duplication keeps the first occurrence
 *
 * A video already seen is a repeat, whether it came from an earlier entry or —
 * and this is what `destinationVideoIds` adds — from the destination playlist
 * the merge is being appended to. Seeding `seen` with the destination's videos
 * is the whole of duplicate detection against it: one argument, no new
 * algorithm, and "first occurrence wins" is unchanged.
 *
 * Keeping the first occurrence puts the video in the position the arrangement
 * gives it; keeping the last would move it away from there, for no benefit.
 *
 * `destinationDuplicateCount` is reported separately so the interface can say
 * *why* the count fell when a destination was chosen, but it is part of
 * `duplicateCount`, not additional to it — they sit under one opt-in and one
 * number.
 *
 * ## No position is ever emitted
 *
 * The merge appends, so adding the steps in order reproduces this list exactly.
 * A request that carries no position cannot be refused for an out-of-range one,
 * and excluded duplicates cannot corrupt placement because there is no index
 * arithmetic for them to disturb.
 *
 * Pure.
 */
export function buildMergePlan(
  entries: readonly IMergeEntry[],
  destinationVideoIds: ReadonlySet<string>,
  removeDuplicates: boolean,
): IMergePlan {
  const seen = new Set<string>(destinationVideoIds)
  const steps: IBuildStep[] = []

  let duplicateCount = 0
  let destinationDuplicateCount = 0

  for (const entry of entries) {
    if (seen.has(entry.videoId)) {
      duplicateCount += 1

      if (destinationVideoIds.has(entry.videoId)) {
        destinationDuplicateCount += 1
      }

      if (removeDuplicates) continue
    }

    seen.add(entry.videoId)
    steps.push({ key: mintKey(), videoId: entry.videoId })
  }

  return {
    steps,
    totalVideos: entries.length,
    duplicateCount,
    destinationDuplicateCount,
  }
}
