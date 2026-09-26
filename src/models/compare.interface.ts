import type { IPlaylist, IVideo } from '@/models/copy.interface'

export type CompareFilter = 'onlyA' | 'both' | 'onlyB'
export type CompareSide = 'a' | 'b'
export type CompareCopyDirection = 'toA' | 'toB'
export type ComparePresence = CompareFilter

export interface ICompareRow {
  video: IVideo
  presence: ComparePresence
}

export interface ICompareSummary {
  totalA: number
  totalB: number
  shared: number
  onlyA: number
  onlyB: number
}

export interface ICompareCopyRequest {
  direction: CompareCopyDirection
  destination: IPlaylist
  videos: readonly IVideo[]
}
