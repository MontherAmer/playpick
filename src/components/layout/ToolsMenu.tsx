import { ChevronDown, Sparkles } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'

import { ToolMenuItem } from '@/components/layout/ToolMenuItem'
import { TOOLS } from '@/features/tools/toolCatalog'
import { useDisclosureMenu } from '@/hooks/useDisclosureMenu'
import { cn } from '@/utils/cn'

/**
 * The wide-viewport tools navigation.
 *
 * A disclosure button controlling a list of links, deliberately not an ARIA
 * menu: these entries navigate, so they stay real links that Tab reaches and
 * Ctrl/Cmd-click opens in a new tab. `NavMenu` carries the same list below `md`.
 *
 * Every tool is listed, including the ones with no page yet. Hiding them would
 * leave the menu empty today and would stop people seeing what PlayPick offers.
 */
export function ToolsMenu() {
  const { t } = useTranslation()
  const { isOpen, toggle, close, triggerRef, panelRef } = useDisclosureMenu()
  const panelId = useId()

  return (
    <div className="relative">
      <button
        type="button"
        ref={triggerRef}
        onClick={toggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          isOpen
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
        )}>
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        {t('nav.tools')}
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isOpen && 'rotate-180')} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          id={panelId}
          ref={panelRef}
          // Anchored with logical `start-0`, so Arabic mirrors without a second rule.
          className="absolute start-0 top-full z-50 mt-1 w-60 rounded-lg border bg-popover p-1 text-popover-foreground shadow-elevated">
          <ul>
            {TOOLS.map((tool) => (
              <ToolMenuItem key={tool.id} tool={tool} onNavigate={close} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
