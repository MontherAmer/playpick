import { Menu } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'

import { ToolMenuItem } from '@/components/layout/ToolMenuItem'
import { buttonStyles } from '@/components/ui/buttonStyles'
import { TOOLS } from '@/features/tools/toolCatalog'
import { useDisclosureMenu } from '@/hooks/useDisclosureMenu'
import { ROUTES } from '@/routes'
import { cn } from '@/utils/cn'

/**
 * The collapsed navigation, shown where the inline navigation does not fit.
 *
 * It holds the same entries as the wide-viewport header — the dashboard link
 * and every tool, in the same order with the same availability — because both
 * read the same catalog. No capability may disappear by narrowing the viewport.
 */
export function NavMenu() {
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
        aria-label={t('nav.menu')}
        className={buttonStyles({ variant: 'ghost', size: 'icon' })}>
        {/* Not mirrored in Arabic: its meaning does not depend on direction. */}
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          id={panelId}
          ref={panelRef}
          className="absolute end-0 top-full z-50 mt-1 w-64 rounded-lg border bg-popover p-1 text-popover-foreground shadow-elevated">
          <ul>
            <li>
              <NavLink
                to={ROUTES.dashboard}
                onClick={close}
                className={({ isActive }) =>
                  cn(
                    'flex items-center rounded-md px-2 py-1.5 text-sm transition-colors',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                    isActive
                      ? 'bg-accent font-semibold text-accent-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground',
                  )
                }>
                {t('nav.dashboard')}
              </NavLink>
            </li>
          </ul>

          <div className="my-1 h-px bg-border" role="separator" />

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
