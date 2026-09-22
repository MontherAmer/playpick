import type { LucideIcon } from 'lucide-react'

export type Locale = 'en' | 'ar'

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

export interface ILandingCopy {
  tagline: string
  sub: string
  continue: string
  privacy: string
  tools: string
  library: string
  toolboxLabel: string
  toolboxTitle: string
  toolboxDescription: string
  footerTagline: string
  privacyLink: string
  termsLink: string
  helpLink: string
  badge: string
  previewTitle: string
  previewReady: string
  previewSource: string
  previewDestination: string
  previewChanges: string
  previewSave: string
}

export interface IToolDefinition {
  id: ToolId
  label: string
  ar: string
  desc: string
  icon: LucideIcon
}

export interface IPreviewVideo {
  id: number
  title: string
  channel: string
  image: string
}
