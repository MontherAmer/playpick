import type { IPendingCopy } from '@/models/copy.interface'
import type { IMoveStep } from '@/models/move.interface'

export function buildMovePlan(
  pending: readonly IPendingCopy[],
  includeDuplicates: boolean,
): IMoveStep[] {
  return pending
    .filter((move) => includeDuplicates || !move.isDuplicate)
    .map((move) => ({
      key: move.key,
      sourcePlaylistItemId: move.video.id,
      videoId: move.video.videoId,
      destinationAdded: false,
    }))
}
