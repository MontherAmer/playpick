import type { InsightsDurationBucketId } from '@/models/insights.interface'

export const INSIGHTS_YEAR_SPAN = 6
export const INSIGHTS_TOP_CHANNEL_COUNT = 5
export const INSIGHTS_TOP_PLAYLIST_COUNT = 5

export const INSIGHTS_STAT_KEYS = [
  'playlists',
  'videoEntries',
  'uniqueVideos',
  'duplicates',
  'duration',
] as const

export const INSIGHTS_DURATION_BUCKETS: readonly InsightsDurationBucketId[] = [
  'under5',
  'from5to20',
  'from20to60',
  'over60',
]

export const FIVE_MINUTES_SECONDS = 5 * 60
export const TWENTY_MINUTES_SECONDS = 20 * 60
export const ONE_HOUR_SECONDS = 60 * 60
