import type { IVideo } from '@/models/copy.interface'
import type {
  IInsightsChannel,
  IInsightsDurationBucket,
  IInsightsPlaylistRow,
  IInsightsPlaylistScan,
  IInsightsReport,
  IInsightsYearBar,
  InsightsDurationBucketId,
} from '@/models/insights.interface'

import {
  FIVE_MINUTES_SECONDS,
  INSIGHTS_DURATION_BUCKETS,
  INSIGHTS_TOP_CHANNEL_COUNT,
  INSIGHTS_TOP_PLAYLIST_COUNT,
  INSIGHTS_YEAR_SPAN,
  ONE_HOUR_SECONDS,
  TWENTY_MINUTES_SECONDS,
} from './insights.constants'

const ISO_DURATION_PATTERN =
  /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/

export function parseIsoDurationSeconds(value: string): number | null {
  const match = value.match(ISO_DURATION_PATTERN)

  if (!match) return null

  const days = Number(match[1] ?? 0)
  const hours = Number(match[2] ?? 0)
  const minutes = Number(match[3] ?? 0)
  const seconds = Number(match[4] ?? 0)
  const totalSeconds = days * 86_400 + hours * 3_600 + minutes * 60 + seconds

  return Number.isFinite(totalSeconds) ? Math.floor(totalSeconds) : null
}

export function formatCompactDuration(totalSeconds: number): {
  hours: number
  minutes: number
} {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))

  return {
    hours: Math.floor(safeSeconds / 3_600),
    minutes: Math.floor((safeSeconds % 3_600) / 60),
  }
}

function toBarPercent(count: number, maxCount: number): number {
  if (count <= 0 || maxCount <= 0) return 0

  return Math.max(8, Math.round((count / maxCount) * 100))
}

function readAddedYear(dateAdded?: string): number | null {
  if (!dateAdded) return null

  const year = new Date(dateAdded).getUTCFullYear()

  return Number.isFinite(year) ? year : null
}

export function classifyDurationBucket(
  durationSeconds: number,
): InsightsDurationBucketId {
  if (durationSeconds < FIVE_MINUTES_SECONDS) return 'under5'
  if (durationSeconds < TWENTY_MINUTES_SECONDS) return 'from5to20'
  if (durationSeconds < ONE_HOUR_SECONDS) return 'from20to60'

  return 'over60'
}

export function buildYearBars(
  videos: readonly IVideo[],
  currentYear: number,
): IInsightsYearBar[] {
  const startYear = currentYear - INSIGHTS_YEAR_SPAN + 1
  const counts = new Map<number, number>()

  for (let year = startYear; year <= currentYear; year += 1) {
    counts.set(year, 0)
  }

  for (const video of videos) {
    const year = readAddedYear(video.dateAdded)

    if (year === null || year < startYear || year > currentYear) continue

    counts.set(year, (counts.get(year) ?? 0) + 1)
  }

  const maxCount = Math.max(...counts.values(), 0)

  return [...counts.entries()].map(([year, count]) => ({
    year,
    count,
    heightPercent: toBarPercent(count, maxCount),
  }))
}

export function buildTopChannels(videos: readonly IVideo[]): IInsightsChannel[] {
  const uniqueVideos = new Map<string, IVideo>()

  for (const video of videos) {
    if (video.isUnavailable || !video.channelTitle) continue
    if (uniqueVideos.has(video.videoId)) continue

    uniqueVideos.set(video.videoId, video)
  }

  const counts = new Map<string, number>()

  for (const video of uniqueVideos.values()) {
    const channelTitle = video.channelTitle

    if (!channelTitle) continue

    counts.set(channelTitle, (counts.get(channelTitle) ?? 0) + 1)
  }

  const ranked = [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, INSIGHTS_TOP_CHANNEL_COUNT)
  const maxCount = ranked[0]?.[1] ?? 0

  return ranked.map(([name, count]) => ({
    name,
    count,
    widthPercent: toBarPercent(count, maxCount),
  }))
}

export function buildLargestPlaylists(
  scans: readonly IInsightsPlaylistScan[],
): IInsightsPlaylistRow[] {
  return [...scans]
    .sort(
      (left, right) =>
        right.itemCount - left.itemCount ||
        left.playlist.title.localeCompare(right.playlist.title),
    )
    .slice(0, INSIGHTS_TOP_PLAYLIST_COUNT)
    .map((scan) => ({
      id: scan.playlist.id,
      title: scan.playlist.title,
      thumbnailUrl: scan.playlist.thumbnailUrl,
      itemCount: scan.itemCount,
    }))
}

export function buildDurationBuckets(
  durationSecondsByVideoId: ReadonlyMap<string, number>,
): IInsightsDurationBucket[] {
  const counts: Record<InsightsDurationBucketId, number> = {
    under5: 0,
    from5to20: 0,
    from20to60: 0,
    over60: 0,
  }

  for (const durationSeconds of durationSecondsByVideoId.values()) {
    counts[classifyDurationBucket(durationSeconds)] += 1
  }

  const maxCount = Math.max(...Object.values(counts), 0)

  return INSIGHTS_DURATION_BUCKETS.map((id) => ({
    id,
    count: counts[id],
    heightPercent: toBarPercent(counts[id], maxCount),
  }))
}

export function buildInsightsReport({
  videos,
  scans,
  durationSecondsByVideoId,
  currentYear,
}: {
  videos: readonly IVideo[]
  scans: readonly IInsightsPlaylistScan[]
  durationSecondsByVideoId: ReadonlyMap<string, number>
  currentYear: number
}): IInsightsReport {
  const uniqueVideoIds = new Set(videos.map((video) => video.videoId))
  let durationSeconds = 0

  for (const seconds of durationSecondsByVideoId.values()) {
    durationSeconds += seconds
  }

  return {
    playlistCount: scans.length,
    videoEntries: videos.length,
    uniqueVideos: uniqueVideoIds.size,
    duplicates: Math.max(0, videos.length - uniqueVideoIds.size),
    durationSeconds,
    years: buildYearBars(videos, currentYear),
    channels: buildTopChannels(videos),
    largestPlaylists: buildLargestPlaylists(scans),
    durationBuckets: buildDurationBuckets(durationSecondsByVideoId),
    failedPlaylistCount: scans.filter((scan) => scan.failed).length,
  }
}
