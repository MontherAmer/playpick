import { useCallback, useMemo, useState } from 'react'

import { buildCopyPlan, buildDestinationDraft, type IDestinationRow } from '@/features/copy/buildCopyPlan'
import { isAlreadyPresent, toVideoIdSet } from '@/features/copy/detectDuplicates'
import type { ICopyStep, IPendingAddition } from '@/models/copy'
import type { IPlaylistItem } from '@/models/playlistItem'

export interface ICopyDraft {
  pending: IPendingAddition[]
  /** The destination as displayed: retrieved contents plus pending additions. */
  destinationDraft: IDestinationRow[]
  duplicateCount: number
  includeDuplicates: boolean
  setIncludeDuplicates: (value: boolean) => void
  /** What will actually be sent. Derived, never stored. */
  plan: ICopyStep[]
  /** `plan.length` — the one number shown as pending, estimate and progress total. */
  pendingCount: number
  addCopy: (item: IPlaylistItem, atDraftIndex?: number) => void
  addMany: (items: readonly IPlaylistItem[]) => void
  discard: () => void
}

/** Unique per intent, and deliberately unrelated to any video or membership id. */
let nextKey = 0

function mintKey(): string {
  nextKey += 1

  return `copy-${String(nextKey)}`
}

/**
 * The videos waiting to be copied into the destination.
 *
 * Everything here is local. No method issues a request, and nothing reaches
 * YouTube until the save runs.
 *
 * `plan` and `pendingCount` are derived on every render rather than stored, so
 * toggling `includeDuplicates` updates the count immediately and neither can go
 * stale as the draft changes.
 */
export function useCopyDraft(destinationItems: readonly IPlaylistItem[]): ICopyDraft {
  const [pending, setPending] = useState<IPendingAddition[]>([])
  const [includeDuplicates, setIncludeDuplicates] = useState(false)

  const destinationVideoIds = useMemo(() => toVideoIdSet(destinationItems), [destinationItems])

  const addCopy = useCallback(
    (item: IPlaylistItem, atDraftIndex?: number) => {
      setPending((current) => {
        // Detected against the destination *and* everything already pending, so
        // copying one video twice in a sitting flags the second.
        const pendingVideoIds = new Set(current.map((addition) => addition.videoId))

        return [
          ...current,
          {
            // Never derived from `item.id`: two copies of one video must be two
            // independent additions, and a shared key would collide them.
            key: mintKey(),
            videoId: item.videoId,
            item,
            draftIndex: atDraftIndex ?? destinationItems.length + current.length,
            isDuplicate: isAlreadyPresent(item.videoId, destinationVideoIds, pendingVideoIds),
            hasChosenPosition: atDraftIndex !== undefined,
          },
        ]
      })
    },
    [destinationItems.length, destinationVideoIds],
  )

  const addMany = useCallback(
    (items: readonly IPlaylistItem[]) => {
      // Sequential rather than a batch, so each addition sees the ones before
      // it and a selection containing the same video twice flags the second.
      for (const item of items) addCopy(item)
    },
    [addCopy],
  )

  const discard = useCallback(() => {
    setPending([])
  }, [])

  const destinationDraft = useMemo(() => buildDestinationDraft(destinationItems, pending), [destinationItems, pending])

  const plan = useMemo(
    () => buildCopyPlan(destinationItems, pending, includeDuplicates),
    [destinationItems, pending, includeDuplicates],
  )

  const duplicateCount = useMemo(() => pending.filter((addition) => addition.isDuplicate).length, [pending])

  return {
    pending,
    destinationDraft,
    duplicateCount,
    includeDuplicates,
    setIncludeDuplicates,
    plan,
    pendingCount: plan.length,
    addCopy,
    addMany,
    discard,
  }
}
