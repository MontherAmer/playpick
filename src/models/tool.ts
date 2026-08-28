import type { LucideIcon } from 'lucide-react'

/** The tools offered on the dashboard. Also the suffix of their translation keys. */
export type ToolId = 'reorder' | 'copy' | 'create' | 'build' | 'merge' | 'duplicate'

/**
 * `'soon'` — the tool's screen does not exist yet and its path is not registered
 * with the router. Availability changes only between releases, never during a
 * session.
 */
export type ToolStatus = 'available' | 'soon'

export interface ITool {
  id: ToolId
  icon: LucideIcon
  /**
   * Canonical address, recorded whether or not it is currently reachable.
   * Kept separate from `status` because "where the tool lives" and "does it
   * exist yet" are two different facts: one optional field cannot hold both
   * without making a card navigate to a page that is not served.
   */
  path: string
  status: ToolStatus
}
