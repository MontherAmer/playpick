import type { IVideo } from '@/models/copy.interface'
import type { IDuplicatePlan } from '@/models/duplicate.interface'

export function buildDuplicatePlan(videos: readonly IVideo[]): IDuplicatePlan {
  const seenVideoIds = new Set<string>()
  let unavailableCount = 0
  let repeatedCount = 0

  const steps = videos.flatMap((video) => {
    if (video.isUnavailable) {
      unavailableCount += 1
      return []
    }

    if (seenVideoIds.has(video.videoId)) {
      repeatedCount += 1
    } else {
      seenVideoIds.add(video.videoId)
    }

    return [{ key: `duplicate-${video.id}`, videoId: video.videoId }]
  })

  return {
    steps,
    totalItems: videos.length,
    copyableCount: steps.length,
    unavailableCount,
    repeatedCount,
  }
}
