import type { IPlaylist } from '@/models/copy.interface'

export type InsightsScanPhase = 'playlists' | 'videos' | 'durations'
export type InsightsDurationBucketId = 'under5' | 'from5to20' | 'from20to60' | 'over60'

export interface IInsightsYearBar {
  year: number
  count: number
  heightPercent: number
}

export interface IInsightsChannel {
  name: string
  count: number
  widthPercent: number
}

export interface IInsightsPlaylistRow {
  id: string
  title: string
  thumbnailUrl?: string
  itemCount: number
}

export interface IInsightsDurationBucket {
  id: InsightsDurationBucketId
  count: number
  heightPercent: number
}

export interface IInsightsReport {
  playlistCount: number
  videoEntries: number
  uniqueVideos: number
  duplicates: number
  durationSeconds: number
  years: IInsightsYearBar[]
  channels: IInsightsChannel[]
  largestPlaylists: IInsightsPlaylistRow[]
  durationBuckets: IInsightsDurationBucket[]
  failedPlaylistCount: number
}

export interface IInsightsProgress {
  phase: InsightsScanPhase
  completed: number
  total: number
}

export interface IInsightsPlaylistScan {
  playlist: IPlaylist
  itemCount: number
  failed: boolean
}
