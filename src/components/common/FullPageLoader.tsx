import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function FullPageLoader() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-full flex-1 items-center justify-center p-8">
      <span className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        {t('common.loading')}
      </span>
    </div>
  )
}
