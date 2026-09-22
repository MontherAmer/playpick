import type { JSX } from 'react'

import { ChevronDown, Languages, Menu, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { UserAvatar } from '@/components/auth/user-avatar'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import type { IToolDefinition, ToolId } from '@/models/landing.interface'
import type { IUser } from '@/models/user.interface'

interface ILandingHeaderProps {
  isDark: boolean
  isToolsMenuOpen: boolean
  isAuthenticated: boolean
  user: IUser | null
  tools: IToolDefinition[]
  onToggleLocale: () => void
  onToggleTheme: () => void
  onToggleToolsMenu: () => void
  onToolSelect: (toolId: ToolId) => void
}

export function LandingHeader({
  isDark,
  isToolsMenuOpen,
  isAuthenticated,
  user,
  tools,
  onToggleLocale,
  onToggleTheme,
  onToggleToolsMenu,
  onToolSelect,
}: ILandingHeaderProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 sm:flex sm:px-6">
        <Logo />
        <nav className="ms-8 hidden items-center gap-1 md:flex">
          <div className="relative">
            <Button variant="ghost" onClick={onToggleToolsMenu}>
              {t('nav.tools')}
              <ChevronDown className="size-4" />
            </Button>
            {isToolsMenuOpen ? (
              <div className="absolute start-0 top-11 grid w-[420px] grid-cols-2 gap-1 rounded-lg border border-border bg-popover p-2 shadow-xl">
                {tools.map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => {
                      onToolSelect(tool.id)
                    }}
                    className="flex gap-3 rounded-md p-3 text-start hover:bg-accent"
                  >
                    <tool.icon className="mt-0.5 size-4 text-primary" />
                    <span>
                      <b className="block text-sm">{t(`tools.${tool.id}.title`)}</b>
                      <small className="text-muted-foreground">
                        {t(`tools.${tool.id}.description`)}
                      </small>
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <a
            href="#features"
            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            {t('nav.library')}
          </a>
        </nav>
        <div className="ms-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleLocale}
            title={t('common.switchLanguage')}
          >
            <Languages />
            <span className="sr-only">{t('common.switchLanguage')}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            title={t('common.toggleTheme')}
          >
            {isDark ? <Sun /> : <Moon />}
            <span className="sr-only">{t('common.toggleTheme')}</span>
          </Button>
          {isAuthenticated && user ? <UserAvatar user={user} /> : null}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={t('common.openMenu')}
          >
            <Menu />
          </Button>
        </div>
      </div>
    </header>
  )
}
