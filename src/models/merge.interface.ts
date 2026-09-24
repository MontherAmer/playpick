import type { IPlaylist, IVideo } from './copy.interface'

export type MergeDestinationKind = 'new' | 'existing'

export interface IMergeEntry {
  key: string
  sourcePlaylistId: string
  sourcePlaylistTitle: string
  video: IVideo
  isDuplicate: boolean
}

export interface IMergeSource {
  playlist: IPlaylist
  videos: IVideo[]
}
