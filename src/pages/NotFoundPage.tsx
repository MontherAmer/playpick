import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { buttonStyles } from '@/components/ui/buttonStyles'
import { ROUTES } from '@/routes'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-bold tracking-tight">{t('notFound.title')}</h1>

      <p className="text-muted-foreground">{t('notFound.description')}</p>

      <Link to={ROUTES.landing} className={buttonStyles({ variant: 'outline' })}>
        {t('notFound.backHome')}
      </Link>
    </div>
  )
}
