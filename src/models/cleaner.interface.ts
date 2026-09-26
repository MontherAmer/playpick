import type { IVideo } from '@/models/copy.interface'

export type CleanerKeepRule = 'first' | 'latest'
export type CleanerIssueKind = 'unavailable' | 'deleted' | 'private'
export type CleanerStatKey = 'duplicateVideos' | 'unavailableVideos' | 'deletedOrPrivate'

export interface ICleanerDuplicateGroup {
  videoId: string
  title: string
  channelTitle?: string
  thumbnailUrl?: string
  occurrences: IVideo[]
}

export interface ICleanerSummary {
  duplicateVideos: number
  unavailableVideos: number
  deletedOrPrivate: number
}

export interface ICleanerStep {
  key: string
  playlistItemId: string
}
