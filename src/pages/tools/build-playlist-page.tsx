import type { JSX } from 'react'

import { BuildPlaylistWorkspace } from '@/components/build/build-playlist-workspace'
import { ToolPage } from '@/pages/tools/tool-page'

export function BuildPlaylistPage(): JSX.Element {
  return (
    <ToolPage toolId="build">
      <BuildPlaylistWorkspace />
    </ToolPage>
  )
}
