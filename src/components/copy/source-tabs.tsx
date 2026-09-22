import type { JSX } from 'react'

import { CirclePlay, Heart, Library, Link, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/cn'
import type { CopySourceMode } from '@/models/copy.interface'

interface ISourceTabsProps {
  value: CopySourceMode
  onChange: (mode: CopySourceMode) => void
}

const SOURCE_MODES = [
  { value: 'mine', icon: Library },
  { value: 'saved', icon: Heart },
  { value: 'playlist', icon: CirclePlay },
  { value: 'search', icon: Search },
  { value: 'paste', icon: Link },
] as const

export function SourceTabs({ value, onChange }: ISourceTabsProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border p-2">
      {SOURCE_MODES.map((mode) => (
        <button
          key={mode.value}
          type="button"
          onClick={() => onChange(mode.value)}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors',
            value === mode.value
              ? 'bg-primary-soft text-primary'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground',
          )}
        >
          <mode.icon className="size-3.5" />
          {t(`copy.sources.${mode.value}`)}
        </button>
      ))}
    </div>
  )
}
