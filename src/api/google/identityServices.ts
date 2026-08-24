import { GOOGLE_OAUTH_SCOPES, getGoogleClientId } from '@/api/google/config'
import { AuthError } from '@/api/google/errors'
import type { IGoogleIdentityServices } from '@/api/google/types'

const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

/** A silent request must not hang the UI if Google never calls back. */
const SILENT_REQUEST_TIMEOUT_MS = 10_000

export interface IAccessToken {
  accessToken: string
  /** Epoch milliseconds. */
  expiresAt: number
  grantedScopes: string[]
}

let loaderPromise: Promise<IGoogleIdentityServices> | null = null

/** Loads the GSI script once and resolves when `window.google` is usable. */
export function loadIdentityServices(): Promise<IGoogleIdentityServices> {
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve(window.google)
  }

  loaderPromise ??= new Promise<IGoogleIdentityServices>((resolve, reject) => {
    const fail = () => {
      loaderPromise = null
      reject(new AuthError('scriptUnavailable', `Could not load ${GSI_SCRIPT_SRC}`))
    }

    const settle = () => {
      if (window.google?.accounts?.oauth2) resolve(window.google)
      else fail()
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SCRIPT_SRC}"]`)

    if (existing) {
      existing.addEventListener('load', settle, { once: true })
      existing.addEventListener('error', fail, { once: true })
      return
    }

    const script = document.createElement('script')

    script.src = GSI_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.addEventListener('load', settle, { once: true })
    script.addEventListener('error', fail, { once: true })

    document.head.appendChild(script)
  })

  return loaderPromise
}

/**
 * Requests an access token.
 *
 * `interactive` shows the account chooser and is only valid from a user
 * gesture. `silent` reuses an existing grant and never shows UI — it rejects
 * instead, which is what makes session restore on page load safe.
 */
export async function requestAccessToken(mode: 'interactive' | 'silent'): Promise<IAccessToken> {
  const clientId = getGoogleClientId()
  const google = await loadIdentityServices()

  return new Promise<IAccessToken>((resolve, reject) => {
    let settled = false
    let timeoutId: number | undefined

    const finish = (outcome: () => void) => {
      if (settled) return
      settled = true
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
      outcome()
    }

    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_OAUTH_SCOPES.join(' '),
      callback: (response) => {
        finish(() => {
          if (response.error) {
            reject(
              new AuthError(
                response.error === 'access_denied' ? 'accessDenied' : 'unknown',
                response.error_description ?? response.error,
              ),
            )
            return
          }

          resolve({
            accessToken: response.access_token,
            expiresAt: Date.now() + Number(response.expires_in) * 1000,
            grantedScopes: response.scope ? response.scope.split(' ') : [],
          })
        })
      },
      error_callback: (error) => {
        finish(() => {
          if (error.type === 'popup_closed') {
            reject(new AuthError('popupClosed', error.message))
          } else if (error.type === 'popup_failed_to_open') {
            reject(new AuthError('popupBlocked', error.message))
          } else {
            reject(new AuthError('unknown', error.message ?? error.type))
          }
        })
      },
    })

    if (mode === 'silent') {
      timeoutId = window.setTimeout(() => {
        finish(() => {
          reject(new AuthError('unknown', 'Silent token request timed out'))
        })
      }, SILENT_REQUEST_TIMEOUT_MS)
    }

    // An empty prompt tells GSI to skip all UI when the grant already exists.
    client.requestAccessToken(mode === 'silent' ? { prompt: '' } : undefined)
  })
}

/** Best-effort revocation. Sign-out must succeed locally regardless. */
export function revokeAccessToken(accessToken: string): void {
  void loadIdentityServices()
    .then((google) => {
      google.accounts.oauth2.revoke(accessToken)
    })
    .catch(() => {
      // Nothing to do — the in-memory token is dropped either way.
    })
}
