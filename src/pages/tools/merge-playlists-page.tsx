import type { JSX } from 'react'

import { MergePlaylistsWorkspace } from '@/components/merge/merge-playlists-workspace'
import { ToolPage } from '@/pages/tools/tool-page'

export function MergePlaylistsPage(): JSX.Element {
  return (
    <ToolPage toolId="merge">
      <MergePlaylistsWorkspace />
    </ToolPage>
  )
}
