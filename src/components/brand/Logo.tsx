import { Check, Play } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/utils/cn'

interface LogoProps {
  className?: string
  withWordmark?: boolean
}

export function Logo({ className, withWordmark = true }: LogoProps) {
  const { t } = useTranslation()

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-foreground shadow-brand-glow">
        <Play className="h-4 w-4 fill-current" aria-hidden="true" />

        <span className="absolute -bottom-1 -end-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-background bg-foreground text-background">
          <Check className="h-2.5 w-2.5" strokeWidth={4} aria-hidden="true" />
        </span>
      </span>

      {withWordmark && <span className="text-lg font-bold tracking-tight">{t('app.name')}</span>}
    </span>
  )
}
