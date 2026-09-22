import type { JSX, ReactNode } from 'react'

import { ChevronDown, Languages, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { UserAvatar } from '@/components/auth/user-avatar'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { LANDING_TOOLS } from '@/constants/landing.constants'
import { useToolShell } from '@/hooks/use-tool-shell'
import type { ToolId } from '@/models/landing.interface'

interface IToolPageProps {
  toolId: ToolId
  children?: ReactNode
}

export function ToolPage({ toolId, children }: IToolPageProps): JSX.Element {
  const { t } = useTranslation()
  const shell = useToolShell()
  const currentTool = LANDING_TOOLS.find((tool) => tool.id === toolId)
  const ToolIcon = currentTool?.icon

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Logo />
          <div className="relative ms-4 hidden md:block">
            <Button variant="ghost" onClick={shell.handleToggleToolsMenu}>
              {t('nav.tools')}
              <ChevronDown />
            </Button>
            {shell.isToolsMenuOpen ? (
              <div className="absolute start-0 top-11 grid w-[420px] grid-cols-2 gap-1 rounded-lg border border-border bg-popover p-2 shadow-xl">
                {LANDING_TOOLS.map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    className="flex gap-3 rounded-md p-3 text-start hover:bg-accent"
                    onClick={() => shell.handleToolSelect(tool.id)}
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
          <div className="ms-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={shell.handleToggleLocale}
              aria-label={t('common.switchLanguage')}
            >
              <Languages />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={shell.handleToggleTheme}
              aria-label={t('common.toggleTheme')}
            >
              {shell.isDark ? <Sun /> : <Moon />}
            </Button>
            {shell.user ? <UserAvatar user={shell.user} /> : null}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 pb-28 sm:px-6">
        <div className="mb-7 flex items-center gap-4">
          {ToolIcon ? (
            <div className="grid size-11 place-items-center rounded-lg bg-primary-soft text-primary">
              <ToolIcon className="size-5" />
            </div>
          ) : null}
          <div>
            <p className="text-xs font-semibold text-muted-foreground">
              {t('app.name')} / {t('nav.tools')}
            </p>
            <h1 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl">
              {t(`tools.${toolId}.title`)}
            </h1>
          </div>
        </div>
        {children}
      </main>
    </div>
  )
}
