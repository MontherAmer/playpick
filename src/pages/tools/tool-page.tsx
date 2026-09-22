import type { JSX } from 'react'

import { useTranslation } from 'react-i18next'

import { Logo } from '@/components/logo'
import type { ToolId } from '@/models/landing.interface'

interface IToolPageProps {
  toolId: ToolId
}

export function ToolPage({ toolId }: IToolPageProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/70">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6">
          <Logo />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">
          {t(`tools.${toolId}.title`)}
        </h1>
      </main>
    </div>
  )
}
