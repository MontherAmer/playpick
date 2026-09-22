import type { JSX } from 'react'

import { Play } from 'lucide-react'

export function Logo(): JSX.Element {
  return (
    <a
      href="/"
      className="flex items-center gap-2.5 font-display text-xl font-extrabold text-foreground"
    >
      <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
        <Play className="size-4 fill-current" />
      </span>
      PlayPick
    </a>
  )
}
