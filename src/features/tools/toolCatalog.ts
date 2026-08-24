import { ArrowRightLeft, Copy, Layers, ListPlus, Merge, Shuffle } from 'lucide-react'

import type { ITool } from '@/models/tool'

/**
 * The three tools of the MVP, shown as large cards.
 * `route` is added to each one as its page lands.
 */
export const PRIMARY_TOOLS: readonly ITool[] = [
  { id: 'reorder', icon: Shuffle },
  { id: 'copy', icon: ArrowRightLeft },
  { id: 'create', icon: ListPlus },
]

/** Secondary tools, shown as compact cards. */
export const SECONDARY_TOOLS: readonly ITool[] = [
  { id: 'build', icon: Layers },
  { id: 'merge', icon: Merge },
  { id: 'duplicate', icon: Copy },
]
