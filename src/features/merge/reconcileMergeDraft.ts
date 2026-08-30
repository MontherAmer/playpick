import type { IMergeEntry, IMergeSource } from '@/models/merge'

/**
 * The draft's identity for one membership.
 *
 * `sourcePlaylistId + itemId`, for the reasons set out on `IMergeEntry`. The
 * separator only has to be a character that cannot appear in either id; the
 * ids themselves are opaque YouTube strings.
 */
function entryId(sourcePlaylistId: string, itemId: string): string {
  return `${sourcePlaylistId}::${itemId}`
}

/**
 * Bring a held merge draft back in line with the sources, **without ever
 * rebuilding the arrangement**.
 *
 * From feature 008 the merged order is state rather than something derived on
 * every render, which is what lets someone rearrange it. The price is that the
 * order now has to be reconciled every time the selection changes, and this
 * function is the whole of that.
 *
 * ## The rule
 *
 * ```text
 * available ← for each source in `read` status, in the order given:
 *               its items, in the playlist's own order, excluding unavailable ones
 *
 * kept      ← held entries whose id is still available, in their held order
 * appended  ← available entries not already held, in deterministic order
 *
 * result    ← kept ++ appended
 * ```
 *
 * `kept` keeping its order is the requirement. Rebuilding the deterministic
 * order on a selection change would silently throw away an arrangement someone
 * made deliberately — the outcome the specification explicitly rejected.
 *
 * ## A source that is not `'read'` is unknown, not empty
 *
 * This is the subtle one, and the reason the function takes `IMergeSource`
 * rather than a flat list of items.
 *
 * Such a source contributes nothing to `available` — it cannot, its contents are
 * unknown. But its held entries are **not dropped** on the strength of that
 * absence, because absence here means *unknown*, not *gone*. Dropping them would
 * make an in-flight re-read look like a deletion: the draft would visibly shrink
 * mid-read and then grow back, and any arrangement within that source would be
 * lost on the way through.
 *
 * Entries are therefore dropped only when their source is genuinely no longer
 * selected, or when their source **has** been read and no longer contains that
 * membership.
 *
 * ## Unavailable videos never enter the draft
 *
 * They cannot be added and cannot meaningfully be arranged. The summary still
 * reports them as its own figure, so they are not hidden — they are simply not
 * part of an arrangement of what will be added.
 *
 * Pure. Idempotent. From an empty draft it reproduces feature 007's
 * deterministic order exactly, which is what makes this change invisible until
 * someone actually rearranges something.
 */
export function reconcileMergeDraft(held: readonly IMergeEntry[], sources: readonly IMergeSource[]): IMergeEntry[] {
  /** Sources still selected, whatever their status — the "no longer selected" test. */
  const selectedIds = new Set(sources.map((source) => source.playlist.id))
  /** Sources whose contents are actually known — the "no longer contains it" test. */
  const readIds = new Set(sources.filter((source) => source.status === 'read').map((source) => source.playlist.id))

  const available = new Map<string, IMergeEntry>()

  for (const source of sources) {
    if (source.status !== 'read') continue

    for (const item of source.items) {
      if (item.isUnavailable) continue

      const id = entryId(source.playlist.id, item.id)

      // First occurrence wins, so a source listing one membership twice cannot
      // put the same entry in the draft twice.
      if (available.has(id)) continue

      available.set(id, {
        id,
        sourcePlaylistId: source.playlist.id,
        itemId: item.id,
        videoId: item.videoId,
        item,
      })
    }
  }

  const kept: IMergeEntry[] = []
  const keptIds = new Set<string>()

  for (const entry of held) {
    if (keptIds.has(entry.id)) continue
    if (!selectedIds.has(entry.sourcePlaylistId)) continue

    const fresh = available.get(entry.id)

    if (fresh !== undefined) {
      // Take the freshly read membership so a retitled video updates, while the
      // position in the arrangement is the held one.
      kept.push(fresh)
      keptIds.add(entry.id)
      continue
    }

    // Not available: either the source has not been read (keep it — unknown is
    // not gone) or it has been read and no longer holds this membership (drop).
    if (!readIds.has(entry.sourcePlaylistId)) {
      kept.push(entry)
      keptIds.add(entry.id)
    }
  }

  const appended: IMergeEntry[] = []

  for (const entry of available.values()) {
    if (keptIds.has(entry.id)) continue

    appended.push(entry)
  }

  return [...kept, ...appended]
}
