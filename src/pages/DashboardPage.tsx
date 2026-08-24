import { useTranslation } from 'react-i18next'

/**
 * Intentionally empty for now. The tool cards (Reorder, Copy, Create, …) are
 * added once Google sign-in and the YouTube API layer exist.
 */
export function DashboardPage() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('dashboard.heading')}</h1>

        <p className="mt-2 text-muted-foreground">{t('dashboard.subtitle')}</p>
      </div>

      <section className="animate-fade-in-up rounded-xl border border-dashed p-12 text-center">
        <h2 className="text-sm font-semibold">{t('dashboard.empty.title')}</h2>

        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t('dashboard.empty.description')}</p>
      </section>
    </div>
  )
}
