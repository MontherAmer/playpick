import type { IVideo } from '@/models/copy.interface'

export type RenameDirection = 'asc' | 'desc'
export type RenamePresetId = 'numberedTitle' | 'lessonNumber' | 'partTitle'

export interface IRenamePattern {
  prefix: string
  suffix: string
  separator: string
  startAt: number
  step: number
  padding: number
  direction: RenameDirection
  preserveOriginalTitle: boolean
}

export interface IRenamePreviewRow {
  video: IVideo
  label: string
  isOwned: boolean
  canApply: boolean
}

export interface IRenameStep {
  videoId: string
  title: string
  description: string
  categoryId: string
  tags: string[]
}
