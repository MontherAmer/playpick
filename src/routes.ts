import type { ToolId } from '@/models/landing.interface'

export const TOOL_IDS = [
  'copy',
  'move',
  'build',
  'merge',
  'duplicate',
  'reorder',
  'rename',
  'compare',
  'cleaner',
  'insights',
] as const satisfies readonly ToolId[]

export const ROUTES = {
  landing: '/',
  tools: {
    copy: '/tools/copy',
    move: '/tools/move',
    build: '/tools/build',
    merge: '/tools/merge',
    duplicate: '/tools/duplicate',
    reorder: '/tools/reorder',
    rename: '/tools/rename',
    compare: '/tools/compare',
    cleaner: '/tools/cleaner',
    insights: '/tools/insights',
  },
} as const

export function getToolRoute(toolId: ToolId): string {
  return ROUTES.tools[toolId]
}

export function isToolId(value: string): value is ToolId {
  return (TOOL_IDS as readonly string[]).includes(value)
}
