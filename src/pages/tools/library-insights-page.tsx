import type { JSX } from 'react'

import { LibraryInsightsWorkspace } from '@/components/insights/library-insights-workspace'
import { ToolPage } from '@/pages/tools/tool-page'

export function LibraryInsightsPage(): JSX.Element {
  return (
    <ToolPage toolId="insights">
      <LibraryInsightsWorkspace />
    </ToolPage>
  )
}
