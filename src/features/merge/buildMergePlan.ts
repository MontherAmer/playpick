import type { IBuildStep } from '@/models/build'
import type { IMergeSource } from '@/models/merge'

export interface IMergePlan {
  steps: IBuildStep[]
  /** Available videos across every read source, before de-duplication. */
  totalVideos: number
  duplicateCount: number
  unavailableCount: number
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
 * One left-to-right pass over the sources **in the order given** — which is the
 * order the picker lists them, not the order they were ticked. Tick order would
 * make the outcome depend on invisible state: unticking and re-ticking would
 * silently rearrange the result.
 *
 * Within a source, videos keep their existing relative order.
 *
 * ## What is deliberately skipped
 *
 * **A source that is not `'read'` contributes nothing** — no videos, no counts,
 * not even to `totalVideos`. It cannot: its contents are unknown. Counting it as
 * zero would be indistinguishable from an empty playlist and would quietly
 * shrink the merge. The caller is responsible for refusing to merge while any
 * source is unread; this function simply cannot invent what it has not been
 * given.
 *
 * **Unavailable videos are dropped**, and counted separately. Adding a deleted
 * or private video is a request that always fails, so including one would turn a
 * clean merge into a partial failure and make the "will be added" number a lie.
 *
 * ## De-duplication keeps the first occurrence
 *
 * A video already seen is a repeat, whether it came from an earlier playlist or
 * from earlier in the same one. Keeping the first occurrence puts the video in
 * the position it held in the playlist the person listed first; keeping the last
 * would move it away from that, for no benefit.
 *
 * ## No position is ever emitted
 *
 * The merge appends into a playlist it has just created, so adding the steps in
 * order reproduces this list exactly — and a request that carries no position
 * cannot be refused for an out-of-range one.
 *
 * Pure.
 */
export function buildMergePlan(sources: readonly IMergeSource[], removeDuplicates: boolean): IMergePlan {
  const seen = new Set<string>()
  const steps: IBuildStep[] = []

  let totalVideos = 0
  let duplicateCount = 0
  let unavailableCount = 0

  for (const source of sources) {
    if (source.status !== 'read') continue

    for (const item of source.items) {
      if (item.isUnavailable) {
        unavailableCount += 1
        continue
      }

      totalVideos += 1

      if (seen.has(item.videoId)) {
        duplicateCount += 1

        if (removeDuplicates) continue
      }

      seen.add(item.videoId)
      steps.push({ key: mintKey(), videoId: item.videoId })
    }
  }

  return { steps, totalVideos, duplicateCount, unavailableCount }
}
