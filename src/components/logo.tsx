import type { JSX } from 'react'

import { Play } from 'lucide-react'
import { Link } from 'react-router-dom'

import { ROUTES } from '@/routes'

export function Logo(): JSX.Element {
  return (
    <Link
      to={ROUTES.landing}
      className="flex items-center gap-2.5 font-display text-xl font-extrabold text-foreground"
    >
      <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
        <Play className="size-4 fill-current" />
      </span>
      PlayPick
    </Link>
  )
}
