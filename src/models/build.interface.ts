import type { YouTubeErrorCode } from '@/api/youtube/errors'

import type { IPlaylist, IVideo, PlaylistPrivacy } from './copy.interface'

export type BuildMode = 'empty' | 'build'

export interface IPlaylistDraft {
  title: string
  description: string
  privacy: PlaylistPrivacy
}

export interface IBuildEntry {
  key: string
  video: IVideo
  isDuplicate: boolean
}

export interface IBuildStep {
  key: string
  videoId: string
}

export type BuildSaveStatus = 'idle' | 'creating' | 'adding' | 'succeeded' | 'failed'

export interface IBuildSaveState {
  status: BuildSaveStatus
  completed: number
  total: number
  error: YouTubeErrorCode | null
  failedDuring: 'create' | 'add' | null
  targetPlaylist: IPlaylist | null
}
