import type { JSX } from 'react'

import { ReorderPlaylistWorkspace } from '@/components/reorder/reorder-playlist-workspace'
import { ToolPage } from '@/pages/tools/tool-page'

export function ReorderPlaylistPage(): JSX.Element {
  return (
    <ToolPage toolId="reorder">
      <ReorderPlaylistWorkspace />
    </ToolPage>
  )
}
