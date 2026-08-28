import { ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type { ITool } from '@/models/tool'
import { cn } from '@/utils/cn'

interface ToolCardProps {
  tool: ITool
  /** Large card (icon tile, bigger type) instead of the compact variant. */
  primary?: boolean
}

const CARD_CLASSES =
  'group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-card transition-all duration-300'

const INTERACTIVE_CLASSES =
  'hover:-translate-y-0.5 hover:shadow-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

export function ToolCard({ tool, primary = false }: ToolCardProps) {
  const { t } = useTranslation()
  const { icon: Icon, path, status } = tool

  const isAvailable = status === 'available'

  const content = (
    <>
      <div
        className={cn(
          'flex items-center justify-center rounded-xl bg-brand-muted text-brand transition-colors',
          isAvailable && 'group-hover:bg-brand group-hover:text-brand-foreground',
          primary ? 'h-12 w-12' : 'h-9 w-9',
        )}>
        <Icon className={primary ? 'h-6 w-6' : 'h-5 w-5'} aria-hidden="true" />
      </div>

      <div className="min-w-0">
        <h3 className={cn('leading-tight font-semibold', primary ? 'text-lg' : 'text-sm')}>
          {t(`tools.${tool.id}.title`)}
        </h3>

        <p className={cn('mt-1 leading-relaxed text-muted-foreground', primary ? 'text-sm' : 'text-xs')}>
          {t(`tools.${tool.id}.description`)}
        </p>
      </div>

      {isAvailable ? (
        primary && (
          <ArrowUpRight
            aria-hidden="true"
            className="absolute end-4 top-4 h-5 w-5 text-muted-foreground/50 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:text-brand ltr:group-hover:translate-x-0.5 rtl:-rotate-90 rtl:group-hover:-translate-x-0.5"
          />
        )
      ) : (
        <span className="absolute end-4 top-4 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
          {t('common.soon')}
        </span>
      )}
    </>
  )

  const layoutClasses = primary ? 'gap-4 p-6' : 'gap-3 p-4'

  if (!isAvailable) {
    // No page to open yet: keep the card readable but out of the tab order.
    return <div className={cn(CARD_CLASSES, layoutClasses, 'pe-16')}>{content}</div>
  }

  return (
    <Link to={path} className={cn(CARD_CLASSES, INTERACTIVE_CLASSES, layoutClasses, primary && 'pe-12')}>
      {content}
    </Link>
  )
}
