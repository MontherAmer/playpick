/**
 * Is this video already in the destination?
 *
 * True when it appears in the destination's retrieved contents **or** among the
 * pending additions already made in this session.
 *
 * **Both halves, or the check is decorative.** Comparing only against what
 * YouTube returned would miss the second copy of a video added twice in one
 * sitting — and silently adding that duplicate is exactly what the duplicate
 * requirement exists to prevent. Comparing only against pending additions would
 * miss everything already on the playlist.
 *
 * Matches on `videoId` alone. This is the **one** place in PlayPick where that
 * is correct: everywhere else — React keys, move plans, retry remainders —
 * matching on `videoId` is a bug, because one video may hold two memberships in
 * a playlist and they must stay independent. Here the question is precisely
 * "is this *video* in this playlist", so the membership id is the wrong
 * identity and the video id is the right one.
 *
 * The caller supplies both sets, so it controls what "already present" means at
 * that moment — and so this stays pure.
 */
export function isAlreadyPresent(
  videoId: string,
  destinationVideoIds: ReadonlySet<string>,
  pendingVideoIds: ReadonlySet<string>,
): boolean {
  return destinationVideoIds.has(videoId) || pendingVideoIds.has(videoId)
}

/** The video ids of a list of items, for the set `isAlreadyPresent` expects. */
export function toVideoIdSet(items: readonly { videoId: string }[]): Set<string> {
  return new Set(items.map((item) => item.videoId))
}
