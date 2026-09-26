import type { ICopyStep, IVideo } from '@/models/copy.interface'
import type {
  CompareCopyDirection,
  CompareFilter,
  ICompareRow,
  ICompareSummary,
} from '@/models/compare.interface'

export function uniqueVideosById(videos: readonly IVideo[]): IVideo[] {
  const seenVideoIds = new Set<string>()
  const uniqueVideos: IVideo[] = []

  for (const video of videos) {
    if (seenVideoIds.has(video.videoId)) continue

    seenVideoIds.add(video.videoId)
    uniqueVideos.push(video)
  }

  return uniqueVideos
}

export function buildCompareRows(
  videosA: readonly IVideo[],
  videosB: readonly IVideo[],
): ICompareRow[] {
  const uniqueA = uniqueVideosById(videosA)
  const uniqueB = uniqueVideosById(videosB)
  const videoIdsB = new Set(uniqueB.map((video) => video.videoId))
  const videoIdsA = new Set(uniqueA.map((video) => video.videoId))

  return [
    ...uniqueA.map((video) => ({
      video,
      presence: videoIdsB.has(video.videoId) ? ('both' as const) : ('onlyA' as const),
    })),
    ...uniqueB
      .filter((video) => !videoIdsA.has(video.videoId))
      .map((video) => ({
        video,
        presence: 'onlyB' as const,
      })),
  ]
}

export function buildCompareSummary(rows: readonly ICompareRow[]): ICompareSummary {
  return {
    totalA: rows.filter((row) => row.presence !== 'onlyB').length,
    totalB: rows.filter((row) => row.presence !== 'onlyA').length,
    shared: rows.filter((row) => row.presence === 'both').length,
    onlyA: rows.filter((row) => row.presence === 'onlyA').length,
    onlyB: rows.filter((row) => row.presence === 'onlyB').length,
  }
}

export function filterCompareRows(
  rows: readonly ICompareRow[],
  filter: CompareFilter,
): ICompareRow[] {
  return rows.filter((row) => row.presence === filter)
}

export function getCopyableRows({
  rows,
  filter,
  selectedVideoIds,
  direction,
}: {
  rows: readonly ICompareRow[]
  filter: CompareFilter
  selectedVideoIds: ReadonlySet<string>
  direction: CompareCopyDirection
}): ICompareRow[] {
  const targetPresence = direction === 'toB' ? 'onlyA' : 'onlyB'
  const candidates = rows.filter(
    (row) => row.presence === targetPresence && !row.video.isUnavailable,
  )
  const selected = candidates.filter((row) => selectedVideoIds.has(row.video.videoId))

  if (selected.length > 0) return selected

  const filterMatchesDirection =
    (direction === 'toB' && filter === 'onlyA') ||
    (direction === 'toA' && filter === 'onlyB')

  return filterMatchesDirection ? candidates : []
}

export function buildCompareCopyPlan(videos: readonly IVideo[]): ICopyStep[] {
  return videos.map((video) => ({
    key: `${video.videoId}-${video.id}`,
    videoId: video.videoId,
  }))
}
