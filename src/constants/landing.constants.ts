import {
  ArrowLeftRight,
  BarChart3,
  Copy,
  ListFilter,
  Merge,
  MoveRight,
  Plus,
  Sparkles,
  Wand2,
} from 'lucide-react'

import thumbJavascript from '@/assets/thumb-javascript.jpg'
import thumbMusic from '@/assets/thumb-music.jpg'
import thumbReact from '@/assets/thumb-react.jpg'
import type { IPreviewVideo, IToolDefinition } from '@/models/landing.interface'

export const LANDING_TOOLS: IToolDefinition[] = [
  { id: 'copy', icon: Copy },
  { id: 'move', icon: MoveRight },
  { id: 'build', icon: Plus },
  { id: 'merge', icon: Merge },
  { id: 'duplicate', icon: Copy },
  { id: 'reorder', icon: ListFilter },
  { id: 'rename', icon: Wand2 },
  { id: 'compare', icon: ArrowLeftRight },
  { id: 'cleaner', icon: Sparkles },
  { id: 'insights', icon: BarChart3 },
]

export const PREVIEW_VIDEOS: IPreviewVideo[] = [
  {
    id: 1,
    title: 'JavaScript in 100 Seconds',
    channel: 'Fireship',
    image: thumbJavascript,
  },
  {
    id: 2,
    title: 'React Full Course for Beginners',
    channel: 'freeCodeCamp.org',
    image: thumbReact,
  },
  {
    id: 3,
    title: 'TypeScript Tutorial for Beginners',
    channel: 'Programming with Mosh',
    image: thumbJavascript,
  },
  {
    id: 4,
    title: 'Deep Focus — Music for Coding',
    channel: 'Quiet Quest',
    image: thumbMusic,
  },
]

export const PREVIEW_READY_CHANGES = 3
