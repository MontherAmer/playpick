import { useCallback, useMemo, useState } from 'react'

import { LARGE_MERGE_THRESHOLD, buildMergePlan } from '@/features/merge/buildMergePlan'
import { reconcileMergeDraft } from '@/features/merge/reconcileMergeDraft'
import type { IBuildStep } from '@/models/build'
import type { IMergeEntry, IMergeSource, IMergeSummary } from '@/models/merge'

export interface IMergeDraft {
  /** The arranged order. The **only** thing this hook holds. */
  entries: IMergeEntry[]
  /** Aligned with `entries`: this one will be skipped as a repeat. Derived, never stored. */
  duplicateFlags: boolean[]
  plan: IBuildStep[]
  summary: IMergeSummary
  /** Reorders the draft. Issues no request. Out-of-range or equal indices are a no-op. */
  move: (fromIndex: number, toIndex: number) => void
}

const NO_DESTINATION: ReadonlySet<string> = new Set<string>()

/**
 * The merged draft: an order that is held, and everything else derived from it.
 *
 * That split is the point of feature 008. Feature 007 derived *everything* from
 * the sources, so nothing could drift because nothing was remembered. Letting
 * someone rearrange the result moves the **order** — and only the order — into
 * state. Duplicate flags, the plan and every count still recompute on each
 * render, so rearranging, changing the destination and toggling the opt-in
 * update all of them together and none can go stale.
 *
 * ## `destinationVideoIds` is `null` when it is *unknown*
 *
 * An empty set and an unknown destination are not the same thing, in exactly the
 * way an unread playlist and an empty one are not (see `MergeSourceStatus`).
 * An empty set means the destination is known to hold nothing that matters — a
 * new playlist, or one that is genuinely empty. `null` means its contents have
 * not been read yet, which makes every count provisional and **must block the
 * merge**: proceeding would add videos that are already there, and PlayPick can
 * remove neither them nor the playlist.
 *
 * ## What this hook does not do
 *
 * It issues **no request of any kind** — not on `move`, not on reconciliation.
 * It does not own the source selection or the destination; the page does. It
 * does not persist. And it offers **no per-entry removal**: draft membership
 * comes from the source selection, and a second, invisible kind of held
 * exclusion would then have to survive every reconciliation.
 */
export function useMergeDraft(
  sources: readonly IMergeSource[],
  destinationVideoIds: ReadonlySet<string> | null,
  removeDuplicates: boolean,
): IMergeDraft {
  const [held, setHeld] = useState<readonly IMergeEntry[]>([])

  /**
   * Reconciled during render rather than in an effect, so the entries rendered
   * are always the ones the current sources justify — an effect would paint one
   * frame of the stale order first.
   */
  const entries = useMemo(() => reconcileMergeDraft(held, sources), [held, sources])

  const destinationIds = destinationVideoIds ?? NO_DESTINATION

  const plan = useMemo(
    () => buildMergePlan(entries, destinationIds, removeDuplicates),
    [entries, destinationIds, removeDuplicates],
  )

  /**
   * The same left-to-right walk the planner makes, so a row is marked exactly
   * when the planner skipped it. Recomputed rather than returned from
   * `buildMergePlan` so the planner keeps one job.
   */
  const duplicateFlags = useMemo(() => {
    const seen = new Set<string>(destinationIds)

    return entries.map((entry) => {
      const isRepeat = seen.has(entry.videoId)

      seen.add(entry.videoId)

      return isRepeat
    })
  }, [entries, destinationIds])

  const summary = useMemo<IMergeSummary>(
    () => ({
      playlistCount: sources.length,
      totalVideos: plan.totalVideos,
      duplicateCount: plan.duplicateCount,
      unavailableCount: sources.reduce(
        (total, source) =>
          source.status === 'read' ? total + source.items.filter((item) => item.isUnavailable).length : total,
        0,
      ),
      willAddCount: plan.steps.length,
      isCounting: sources.some((source) => source.status === 'pending' || source.status === 'reading'),
      failedSources: sources.filter((source) => source.status === 'failed').map((source) => source.playlist),
      isLargeMerge: plan.steps.length >= LARGE_MERGE_THRESHOLD,
      destinationDuplicateCount: plan.destinationDuplicateCount,
      isDestinationCounting: destinationVideoIds === null,
    }),
    [sources, plan, destinationVideoIds],
  )

  /**
   * Moves against `entries` — the reconciled order actually on screen — rather
   * than against `held`, which can lag it whenever a source has just finished
   * reading. Indexing into the list someone is looking at is the only way a drop
   * lands where they aimed.
   *
   * Reconciliation is idempotent, so writing the moved order back is stable: the
   * next render reconciles it and gets it unchanged.
   */
  const move = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= entries.length ||
        toIndex >= entries.length
      ) {
        // A drag dropped outside the list, or onto itself. Doing nothing is the
        // whole handling: there is no partial move to undo.
        return
      }

      const next = [...entries]
      const [moved] = next.splice(fromIndex, 1)

      next.splice(toIndex, 0, moved)

      setHeld(next)
    },
    [entries],
  )

  return { entries, duplicateFlags, plan: plan.steps, summary, move }
}
