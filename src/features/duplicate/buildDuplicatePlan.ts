import type { IBuildStep } from '@/models/build'
import type { IDuplicatePlan } from '@/models/duplicate'
import type { IPlaylistItem } from '@/models/playlistItem'

/**
 * Where one duplicate stops being a personal decision and becomes a
 * deployment-wide one.
 *
 * The daily YouTube allowance is 10,000 units for the **whole deployment** and
 * an insert costs 50, so the day holds roughly **200 writes**. Duplicating a
 * 120-video playlist is 60% of that — for every user of PlayPick, not just the
 * person doing it.
 *
 * Deliberately **not** imported from `features/merge`, which has the same figure
 * under its own name. A threshold is a tuning number, not a rule: if this one
 * should later trigger at 60 while Merge's stays at 100, that is a product
 * decision rather than a defect. Sharing it would also be the first
 * feature-to-feature import in this codebase, coupling two tools that otherwise
 * have nothing to do with each other. If a third tool needs the figure, it
 * belongs in a shared quota module alongside the unit costs.
 */
export const LARGE_DUPLICATE_THRESHOLD = 100

/** Unique per emitted step, and deliberately unrelated to any video or membership id. */
let nextKey = 0

function mintKey(): string {
  nextKey += 1

  return `duplicate-${String(nextKey)}`
}

/**
 * What to add to the copy, in the order to add it.
 *
 * ## This planner keeps every repeat. That is the whole point.
 *
 * PlayPick has three other planners that turn items into additions —
 * `buildCopyPlan`, `buildAddPlan` and `buildMergePlan` — and **all three
 * de-duplicate**, because in those tools a second occurrence of a video usually
 * arrives by accident. Here it does not. A playlist that deliberately holds the
 * same video three times is a playlist that holds it three times, and a copy
 * that silently holds it once is not a copy.
 *
 * So there is **no `seen` set, no `removeDuplicates` parameter, and no opt-in**.
 * Every available item produces a step, always.
 *
 * **This function must never be made consistent with its three siblings.** That
 * is the likeliest future change to this feature and it would be a defect, not a
 * tidy-up. The unit being copied is the playlist *item* — one video's membership
 * of one playlist — and `IPlaylistItem` has said so since feature 003: `videoId`
 * is not unique within a playlist and must never be used to key, dedupe or match
 * an item. Duplicate is the tool that takes that comment at face value.
 *
 * ## Unavailable videos are dropped here, not later
 *
 * A deleted or private video cannot be added — the request always fails — so
 * including one would turn a clean run into a partial failure and make the
 * number quoted before the confirmation a lie. They are counted separately so
 * the interface can say how many will and will not be copied.
 *
 * ## Keys are minted per step
 *
 * Not derived from the video, and not from the source membership. A retry after
 * a partial failure has to name precisely which of three occurrences of one
 * video is still outstanding; a key derived from `videoId` would collide all
 * three, and the membership id is meaningless in the destination.
 *
 * ## No position is ever emitted
 *
 * The copy is appended to a playlist that has just been created, so adding the
 * steps in order reproduces this list exactly — and a request that carries no
 * position cannot be refused for an out-of-range one.
 *
 * Pure.
 */
export function buildDuplicatePlan(items: readonly IPlaylistItem[]): IDuplicatePlan {
  const steps: IBuildStep[] = []
  /** Only to count repeats for the summary. It never causes a step to be skipped. */
  const alreadyPlanned = new Set<string>()

  let unavailableCount = 0
  let repeatedCount = 0

  for (const item of items) {
    if (item.isUnavailable) {
      unavailableCount += 1
      continue
    }

    if (alreadyPlanned.has(item.videoId)) {
      repeatedCount += 1
    } else {
      alreadyPlanned.add(item.videoId)
    }

    // Unconditional. There is no branch above this that can skip an available
    // item, and adding one would break the feature.
    steps.push({ key: mintKey(), videoId: item.videoId })
  }

  return { steps, totalItems: items.length, unavailableCount, repeatedCount }
}
