import type { IBuildEntry, IBuildStep } from '@/models/build'

/**
 * Which entries repeat a video already present.
 *
 * One left-to-right walk, seeded with the destination's videos, adding each
 * entry's video as it goes. An entry is a repeat when its video was already
 * seen — either on the destination or earlier in the draft.
 *
 * **The first occurrence is never the repeat.** Adding a video twice flags the
 * second, so excluding repeats keeps the original and drops the copy, which is
 * what someone who did not mean to add it twice expects.
 *
 * Returned aligned with `entries` by index rather than stored on the entries
 * themselves. Feature 004 could freeze this at add time because its destination
 * was fixed before any addition was made; here the destination can be chosen or
 * changed **after** entries exist, and the draft can be reordered, so a frozen
 * flag would quietly describe a state that no longer holds.
 */
export function markRepeats(destinationVideoIds: ReadonlySet<string>, entries: readonly IBuildEntry[]): boolean[] {
  const seen = new Set(destinationVideoIds)

  return entries.map((entry) => {
    const isRepeat = seen.has(entry.videoId)

    seen.add(entry.videoId)

    return isRepeat
  })
}

/**
 * What to send to YouTube, in the order to send it.
 *
 * ## Why there is no position arithmetic here
 *
 * Feature 004's `buildCopyPlan` carries a long argument about taking a position
 * from the final destination rather than the draft index, because excluded
 * duplicates inflate every index after them. **That entire hazard is absent
 * here**, because Build never sends a position at all: it always appends, so
 * adding the surviving entries in draft order reproduces the draft on its own.
 *
 * That is why this function is a filter and a map, and why it has no defect
 * class to be verified against — there is no index to get wrong.
 *
 * Pure.
 */
export function buildAddPlan(
  destinationVideoIds: ReadonlySet<string>,
  entries: readonly IBuildEntry[],
  includeDuplicates: boolean,
): IBuildStep[] {
  const repeats = markRepeats(destinationVideoIds, entries)

  return entries
    .filter((_, index) => includeDuplicates || !repeats[index])
    .map((entry) => ({ key: entry.key, videoId: entry.videoId }))
}

/**
 * How many videos will be added.
 *
 * The plan's length and nothing else, so the count in the draft, the number in
 * the confirmation and the total on the progress dialog are one number rather
 * than three that can disagree.
 */
export function countBuildAdditions(
  destinationVideoIds: ReadonlySet<string>,
  entries: readonly IBuildEntry[],
  includeDuplicates: boolean,
): number {
  return buildAddPlan(destinationVideoIds, entries, includeDuplicates).length
}
