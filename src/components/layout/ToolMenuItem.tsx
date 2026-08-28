import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type { ITool } from '@/models/tool'

interface ToolMenuItemProps {
  tool: ITool
  /** Closes the containing panel once the link has been followed. */
  onNavigate: () => void
}

const ROW_CLASSES = 'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm'

/**
 * One tool in a navigation panel.
 *
 * A tool with no page yet renders as plain, non-interactive content with a
 * visible "Soon" badge — not a disabled button, and not an anchor without an
 * href. Visible text is what conveys unavailability: it reaches every user in
 * every language with no ARIA at all, a screen reader simply reads
 * "Reorder Playlist Soon", and six inert stops stay out of the tab order.
 *
 * The badge reuses the key the dashboard cards use, so both surfaces say the
 * same word.
 */
export function ToolMenuItem({ tool, onNavigate }: ToolMenuItemProps) {
  const { t } = useTranslation()
  const { icon: Icon, id, path, status } = tool

  const title = t(`tools.${id}.title`)

  if (status !== 'available') {
    return (
      <li>
        <div className={`${ROW_CLASSES} justify-between text-muted-foreground`}>
          <span className="flex min-w-0 items-center gap-2">
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {/* Wraps rather than truncates: a clipped tool name is unreadable,
                and title lengths differ per language. */}
            <span>{title}</span>
          </span>

          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase">
            {t('common.soon')}
          </span>
        </div>
      </li>
    )
  }

  return (
    <li>
      <Link
        to={path}
        onClick={onNavigate}
        className={`${ROW_CLASSES} transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring`}>
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span>{title}</span>
      </Link>
    </li>
  )
}
