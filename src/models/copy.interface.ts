import type { YouTubeErrorCode } from '@/api/youtube/errors'

export type PlaylistPrivacy = 'private' | 'public' | 'unlisted'
export type CopySourceMode = 'mine' | 'saved' | 'playlist' | 'search' | 'paste'

export interface IPlaylist {
  id: string
  title: string
  description?: string
  thumbnailUrl?: string
  itemCount: number
  privacy: PlaylistPrivacy
}

export interface IVideo {
  id: string
  videoId: string
  title: string
  channelTitle?: string
  thumbnailUrl?: string
  duration?: string
  isUnavailable: boolean
}

export interface IPendingCopy {
  key: string
  video: IVideo
  isDuplicate: boolean
}

export interface ICopyStep {
  key: string
  videoId: string
}

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'failed'
export type SaveStatus = 'idle' | 'saving' | 'succeeded' | 'failed'

export interface ISaveProgress {
  status: SaveStatus
  completed: number
  total: number
  error: YouTubeErrorCode | null
}
