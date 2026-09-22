import type { JSX } from 'react'

import { Logo } from '@/components/logo'
import type { ILandingCopy } from '@/models/landing.interface'

interface ILandingFooterProps {
  copy: ILandingCopy
}

export function LandingFooter({ copy }: ILandingFooterProps): JSX.Element {
  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Logo />
        <p>{copy.footerTagline}</p>
        <div className="flex gap-5">
          <span>{copy.privacyLink}</span>
          <span>{copy.termsLink}</span>
          <span>{copy.helpLink}</span>
        </div>
      </div>
    </footer>
  )
}
