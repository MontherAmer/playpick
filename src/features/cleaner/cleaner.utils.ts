import type { IVideo } from '@/models/copy.interface'
import type {
  CleanerIssueKind,
  CleanerKeepRule,
  ICleanerDuplicateGroup,
  ICleanerStep,
  ICleanerSummary,
} from '@/models/cleaner.interface'

const DELETED_TITLE = 'Deleted video'
const PRIVATE_TITLE = 'Private video'

export function classifyIssue(video: IVideo): CleanerIssueKind | null {
  if (video.title === DELETED_TITLE) return 'deleted'
  if (video.title === PRIVATE_TITLE) return 'private'
  if (video.isUnavailable) return 'unavailable'

  return null
}

export function markMissingVideos(
  videos: readonly IVideo[],
  knownVideoIds: ReadonlySet<string>,
): IVideo[] {
  return videos.map((video) => {
    if (video.isUnavailable || knownVideoIds.has(video.videoId)) return video

    return { ...video, isUnavailable: true }
  })
}

export function groupDuplicateVideos(
  videos: readonly IVideo[],
): ICleanerDuplicateGroup[] {
  const occurrencesByVideoId = new Map<string, IVideo[]>()

  for (const video of videos) {
    const current = occurrencesByVideoId.get(video.videoId) ?? []
    occurrencesByVideoId.set(video.videoId, [...current, video])
  }

  return [...occurrencesByVideoId.entries()].flatMap(([videoId, occurrences]) => {
    const firstVideo = occurrences[0]

    if (!firstVideo || occurrences.length < 2) return []

    return [
      {
        videoId,
        title: firstVideo.title,
        channelTitle: firstVideo.channelTitle,
        thumbnailUrl: firstVideo.thumbnailUrl,
        occurrences,
      },
    ]
  })
}

export function collectIssueVideos(videos: readonly IVideo[]): IVideo[] {
  return videos.filter((video) => classifyIssue(video) !== null)
}

export function buildCleanerSummary({
  groups,
  videos,
}: {
  groups: readonly ICleanerDuplicateGroup[]
  videos: readonly IVideo[]
}): ICleanerSummary {
  const issues = videos.map(classifyIssue)

  return {
    duplicateVideos: groups.length,
    unavailableVideos: issues.filter((kind) => kind !== null).length,
    deletedOrPrivate: issues.filter(
      (kind) => kind === 'deleted' || kind === 'private',
    ).length,
  }
}

export function buildCleanerPlan({
  groups,
  keepRules,
  issueVideos,
  selectedIssueIds,
}: {
  groups: readonly ICleanerDuplicateGroup[]
  keepRules: Readonly<Record<string, CleanerKeepRule>>
  issueVideos: readonly IVideo[]
  selectedIssueIds: ReadonlySet<string>
}): ICleanerStep[] {
  const removals = new Map<string, ICleanerStep>()

  for (const group of groups) {
    const keepRule = keepRules[group.videoId] ?? 'first'
    const keepIndex = keepRule === 'first' ? 0 : group.occurrences.length - 1

    group.occurrences.forEach((video, index) => {
      if (index === keepIndex) return

      removals.set(video.id, { key: video.id, playlistItemId: video.id })
    })
  }

  for (const video of issueVideos) {
    if (!selectedIssueIds.has(video.id)) continue

    removals.set(video.id, { key: video.id, playlistItemId: video.id })
  }

  return [...removals.values()]
}
