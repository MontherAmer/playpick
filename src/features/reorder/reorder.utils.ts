import type { IVideo } from '@/models/copy.interface'
import type { IReorderMove } from '@/models/reorder.interface'

function longestIncreasingSubsequenceIndices(values: readonly number[]): number[] {
  if (values.length === 0) return []

  const lengths = values.map(() => 1)
  const previous = values.map(() => -1)
  let bestIndex = 0

  for (let index = 1; index < values.length; index += 1) {
    for (let candidate = 0; candidate < index; candidate += 1) {
      if (values[candidate] < values[index] && lengths[candidate] + 1 > lengths[index]) {
        lengths[index] = lengths[candidate] + 1
        previous[index] = candidate
      }
    }

    if (lengths[index] > lengths[bestIndex]) bestIndex = index
  }

  const indices: number[] = []
  let current = bestIndex

  while (current >= 0) {
    indices.unshift(current)
    current = previous[current]
  }

  return indices
}

export function buildReorderPlan(
  original: readonly IVideo[],
  draft: readonly IVideo[],
): IReorderMove[] {
  const originalIndexById = new Map(original.map((video, index) => [video.id, index]))
  const originalIndexes: number[] = []

  for (const video of draft) {
    const originalIndex = originalIndexById.get(video.id)

    if (originalIndex === undefined) return []
    originalIndexes.push(originalIndex)
  }

  const untouchedIds = new Set(
    longestIncreasingSubsequenceIndices(originalIndexes).map((index) => draft[index].id),
  )
  const workingIds = original.map((video) => video.id)
  const moves: IReorderMove[] = []

  for (let index = 0; index < draft.length; index += 1) {
    const video = draft[index]

    if (!video || untouchedIds.has(video.id)) continue

    const currentIndex = workingIds.indexOf(video.id)

    if (currentIndex < 0) return []

    workingIds.splice(currentIndex, 1)
    const previousId = index === 0 ? undefined : draft[index - 1]?.id
    const toPosition = previousId ? workingIds.indexOf(previousId) + 1 : 0

    workingIds.splice(toPosition, 0, video.id)
    moves.push({ playlistItemId: video.id, toPosition })
  }

  return moves
}
