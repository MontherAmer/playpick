import type { JSX } from 'react'

import { ArrowRight, Loader2 } from 'lucide-react'

import { GoogleIcon } from '@/components/brand/google-icon'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

interface IContinueWithGoogleButtonProps {
  label: string
  connectingLabel: string
  isSigningIn: boolean
  onSignIn: () => void
  className?: string
  size?: 'default' | 'sm' | 'lg'
}

export function ContinueWithGoogleButton({
  label,
  connectingLabel,
  isSigningIn,
  onSignIn,
  className,
  size = 'lg',
}: IContinueWithGoogleButtonProps): JSX.Element {
  return (
    <Button
      size={size}
      className={cn('shadow-lg shadow-primary/20', className)}
      onClick={onSignIn}
      disabled={isSigningIn}
    >
      {isSigningIn ? (
        <Loader2 className="size-5 animate-spin" aria-hidden="true" />
      ) : (
        <GoogleIcon className="size-5" />
      )}
      {isSigningIn ? connectingLabel : label}
      {!isSigningIn ? <ArrowRight className="rtl:rotate-180" /> : null}
    </Button>
  )
}
