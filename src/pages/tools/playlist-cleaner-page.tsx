import type { JSX } from 'react'

import { PlaylistCleanerWorkspace } from '@/components/cleaner/playlist-cleaner-workspace'
import { ToolPage } from '@/pages/tools/tool-page'

export function PlaylistCleanerPage(): JSX.Element {
  return (
    <ToolPage toolId="cleaner">
      <PlaylistCleanerWorkspace />
    </ToolPage>
  )
}
