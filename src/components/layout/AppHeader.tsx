import { useTranslation } from 'react-i18next'
import { Link, NavLink } from 'react-router-dom'

import { Logo } from '@/components/brand/Logo'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { NavMenu } from '@/components/layout/NavMenu'
import { ToolsMenu } from '@/components/layout/ToolsMenu'
import { UserMenu } from '@/components/layout/UserMenu'
import { ROUTES } from '@/routes'
import { cn } from '@/utils/cn'

/** Header for the signed-in area. */
export function AppHeader() {
  const { t } = useTranslation()

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-2 px-4 sm:px-6">
        <Link
          to={ROUTES.dashboard}
          className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          {/* The wordmark does not fit alongside the language button, the avatar
              and the menu trigger at 320px, so below `sm` the mark stands alone.
              The link keeps an accessible name either way. */}
          <Logo className="sm:hidden" withWordmark={false} />
          <Logo className="hidden sm:inline-flex" />
        </Link>

        <nav aria-label={t('nav.label')} className="ms-4 hidden items-center gap-1 md:flex">
          <NavLink
            to={ROUTES.dashboard}
            className={({ isActive }) =>
              cn(
                'rounded-md px-3 py-1.5 text-sm transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                isActive
                  ? // Background *and* weight: the active state has to survive
                    // being read without colour.
                    'bg-accent font-semibold text-accent-foreground'
                  : 'font-medium text-muted-foreground hover:bg-accent/60 hover:text-foreground',
              )
            }>
            {t('nav.dashboard')}
          </NavLink>

          <ToolsMenu />
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <LanguageSwitcher />

          <UserMenu />

          <div className="md:hidden">
            <NavMenu />
          </div>
        </div>
      </div>
    </header>
  )
}
