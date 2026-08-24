import type { LucideIcon } from 'lucide-react'

/** The tools offered on the dashboard. Also the suffix of their translation keys. */
export type ToolId = 'reorder' | 'copy' | 'create' | 'build' | 'merge' | 'duplicate'

export interface ITool {
  id: ToolId
  icon: LucideIcon
  /**
   * Target route. Absent while the tool is still being built — the dashboard
   * then renders the card as a non-navigating "soon" card.
   */
  route?: string
}
