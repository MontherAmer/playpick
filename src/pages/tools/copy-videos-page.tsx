import type { JSX } from 'react'

import { CopyVideosWorkspace } from '@/components/copy/copy-videos-workspace'
import { ToolPage } from '@/pages/tools/tool-page'

export function CopyVideosPage(): JSX.Element {
  return (
    <ToolPage toolId="copy">
      <CopyVideosWorkspace />
    </ToolPage>
  )
}
