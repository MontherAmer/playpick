import type { JSX } from 'react'

import { MoveVideosWorkspace } from '@/components/move/move-videos-workspace'
import { ToolPage } from '@/pages/tools/tool-page'

export function MoveVideosPage(): JSX.Element {
  return (
    <ToolPage toolId="move">
      <MoveVideosWorkspace />
    </ToolPage>
  )
}
