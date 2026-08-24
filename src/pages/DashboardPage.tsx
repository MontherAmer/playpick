import { useTranslation } from 'react-i18next'

import { ToolCard } from '@/components/tools/ToolCard'
import { PRIMARY_TOOLS, SECONDARY_TOOLS } from '@/features/tools/toolCatalog'

export function DashboardPage() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('dashboard.heading')}</h1>

        <p className="mt-2 text-muted-foreground">{t('dashboard.subtitle')}</p>
      </div>

      <section className="animate-fade-in-up" aria-labelledby="dashboard-primary-tools">
        <h2
          id="dashboard-primary-tools"
          className="mb-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          {t('dashboard.primary')}
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          {PRIMARY_TOOLS.map((tool) => (
            <ToolCard key={tool.id} tool={tool} primary />
          ))}
        </div>
      </section>

      <section
        className="animate-fade-in-up"
        style={{ animationDelay: '80ms' }}
        aria-labelledby="dashboard-secondary-tools">
        <h2
          id="dashboard-secondary-tools"
          className="mb-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          {t('dashboard.more')}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {SECONDARY_TOOLS.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>
    </div>
  )
}
