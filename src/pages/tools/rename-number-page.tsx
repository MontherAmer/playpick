import type { JSX } from 'react'

import { RenamePlaylistWorkspace } from '@/components/rename/rename-playlist-workspace'
import { ToolPage } from '@/pages/tools/tool-page'

export function RenameNumberPage(): JSX.Element {
  return (
    <ToolPage toolId="rename">
      <RenamePlaylistWorkspace />
    </ToolPage>
  )
}
