import type { JSX } from 'react'

import { DuplicatePlaylistWorkspace } from '@/components/duplicate/duplicate-playlist-workspace'
import { ToolPage } from '@/pages/tools/tool-page'

export function DuplicatePlaylistPage(): JSX.Element {
  return (
    <ToolPage toolId="duplicate">
      <DuplicatePlaylistWorkspace />
    </ToolPage>
  )
}
