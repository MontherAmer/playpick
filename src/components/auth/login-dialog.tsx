import { useEffect, type JSX } from 'react'

import { ShieldCheck, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ContinueWithGoogleButton } from '@/components/auth/continue-with-google-button'
import { Button } from '@/components/ui/button'

interface ILoginDialogProps {
  isSigningIn: boolean
  errorMessage: string | null
  onSignIn: () => void
  onClose: () => void
}

export function LoginDialog({
  isSigningIn,
  errorMessage,
  onSignIn,
  onClose,
}: ILoginDialogProps): JSX.Element {
  const { t } = useTranslation()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !isSigningIn) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSigningIn, onClose])

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-overlay/70 p-4"
      onClick={() => {
        if (!isSigningIn) {
          onClose()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-dialog-title"
        aria-describedby="login-dialog-description"
        className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-2xl"
        onClick={(event) => {
          event.stopPropagation()
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="login-dialog-title" className="font-display text-xl font-extrabold">
              {t('auth.loginTitle')}
            </h2>
            <p
              id="login-dialog-description"
              className="mt-2 text-sm leading-6 text-muted-foreground"
            >
              {t('auth.loginDescription')}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={isSigningIn}
            aria-label={t('common.close')}
          >
            <X />
          </Button>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          <ContinueWithGoogleButton
            label={t('auth.continue')}
            connectingLabel={t('auth.connecting')}
            isSigningIn={isSigningIn}
            onSignIn={onSignIn}
            className="w-full"
          />

          {errorMessage ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {errorMessage}
            </p>
          ) : (
            <p className="text-xs leading-5 text-muted-foreground">
              <ShieldCheck className="me-1 inline size-4 text-success" />
              {t('auth.privacy')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
