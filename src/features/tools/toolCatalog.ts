import { ArrowRightLeft, Copy, Layers, ListPlus, Merge, Shuffle } from 'lucide-react'

import type { ITool } from '@/models/tool'
import { ROUTES } from '@/routes'

/**
 * The three tools of the MVP, shown as large cards.
 * Flip a `status` to `'available'` and register its `path` in the router
 * together — an available tool whose path is not served is a broken link.
 */
export const PRIMARY_TOOLS: readonly ITool[] = [
  { id: 'reorder', icon: Shuffle, path: ROUTES.tools.reorder, status: 'available' },
  { id: 'copy', icon: ArrowRightLeft, path: ROUTES.tools.copy, status: 'available' },
  { id: 'create', icon: ListPlus, path: ROUTES.tools.create, status: 'soon' },
]

/** Secondary tools, shown as compact cards. */
export const SECONDARY_TOOLS: readonly ITool[] = [
  { id: 'build', icon: Layers, path: ROUTES.tools.build, status: 'soon' },
  { id: 'merge', icon: Merge, path: ROUTES.tools.merge, status: 'soon' },
  { id: 'duplicate', icon: Copy, path: ROUTES.tools.duplicate, status: 'soon' },
]

/**
 * Every tool in navigation order, derived from the two dashboard groups rather
 * than declared a second time — the header and the dashboard cannot disagree
 * about what PlayPick offers.
 */
export const TOOLS: readonly ITool[] = [...PRIMARY_TOOLS, ...SECONDARY_TOOLS]
