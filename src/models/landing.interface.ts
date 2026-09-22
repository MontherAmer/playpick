import type { LucideIcon } from 'lucide-react'

export type ToolId =
  | 'copy'
  | 'move'
  | 'build'
  | 'merge'
  | 'duplicate'
  | 'reorder'
  | 'rename'
  | 'compare'
  | 'cleaner'
  | 'insights'

export interface IToolDefinition {
  id: ToolId
  icon: LucideIcon
}

export interface IPreviewVideo {
  id: number
  title: string
  channel: string
  image: string
}
