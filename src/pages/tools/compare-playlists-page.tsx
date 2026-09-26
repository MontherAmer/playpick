import type { JSX } from 'react'

import { ComparePlaylistsWorkspace } from '@/components/compare/compare-playlists-workspace'
import { ToolPage } from '@/pages/tools/tool-page'

export function ComparePlaylistsPage(): JSX.Element {
  return (
    <ToolPage toolId="compare">
      <ComparePlaylistsWorkspace />
    </ToolPage>
  )
}
