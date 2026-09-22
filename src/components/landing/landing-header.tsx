import type { JSX } from 'react'

import { ChevronDown, Languages, Menu, Moon, Sun } from 'lucide-react'

import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import type { ILandingCopy, IToolDefinition, Locale } from '@/models/landing.interface'

interface ILandingHeaderProps {
  locale: Locale
  isDark: boolean
  isToolsMenuOpen: boolean
  copy: ILandingCopy
  tools: IToolDefinition[]
  onToggleLocale: () => void
  onToggleTheme: () => void
  onToggleToolsMenu: () => void
  onCloseToolsMenu: () => void
}

export function LandingHeader({
  locale,
  isDark,
  isToolsMenuOpen,
  copy,
  tools,
  onToggleLocale,
  onToggleTheme,
  onToggleToolsMenu,
  onCloseToolsMenu,
}: ILandingHeaderProps): JSX.Element {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 sm:flex sm:px-6">
        <Logo />
        <nav className="ms-8 hidden items-center gap-1 md:flex">
          <div className="relative">
            <Button variant="ghost" onClick={onToggleToolsMenu}>
              {copy.tools}
              <ChevronDown className="size-4" />
            </Button>
            {isToolsMenuOpen ? (
              <div className="absolute start-0 top-11 grid w-[420px] grid-cols-2 gap-1 rounded-lg border border-border bg-popover p-2 shadow-xl">
                {tools.map((tool) => (
                  <a
                    key={tool.id}
                    href="#features"
                    onClick={onCloseToolsMenu}
                    className="flex gap-3 rounded-md p-3 hover:bg-accent"
                  >
                    <tool.icon className="mt-0.5 size-4 text-primary" />
                    <span>
                      <b className="block text-sm">
                        {locale === 'ar' ? tool.ar : tool.label}
                      </b>
                      <small className="text-muted-foreground">{tool.desc}</small>
                    </span>
                  </a>
                ))}
              </div>
            ) : null}
          </div>
          <a
            href="#features"
            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            {copy.library}
          </a>
        </nav>
        <div className="ms-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleLocale}
            title="Switch language"
          >
            <Languages />
            <span className="sr-only">Language</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            title="Toggle theme"
          >
            {isDark ? <Sun /> : <Moon />}
            <span className="sr-only">Theme</span>
          </Button>
          <div className="ms-2 grid size-9 place-items-center rounded-full bg-secondary font-bold text-secondary-foreground">
            MA
          </div>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
            <Menu />
          </Button>
        </div>
      </div>
    </header>
  )
}
