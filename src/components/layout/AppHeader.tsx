import { Link } from 'react-router-dom'

import { Logo } from '@/components/brand/Logo'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { UserMenu } from '@/components/layout/UserMenu'
import { ROUTES } from '@/routes'

/**
 * Header for the signed-in area. Tool navigation lands here once the
 * playlist tools exist.
 */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-2 px-4 sm:px-6">
        <Link
          to={ROUTES.dashboard}
          className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          <Logo />
        </Link>

        <div className="ms-auto flex items-center gap-2">
          <LanguageSwitcher className="hidden min-w-[120px] sm:block" />

          <UserMenu />
        </div>
      </div>
    </header>
  )
}
