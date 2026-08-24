import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { toAuthErrorCode, type AuthErrorCode } from '@/api/google/errors'
import { requestAccessToken, revokeAccessToken, type IAccessToken } from '@/api/google/identityServices'
import { fetchGoogleUser } from '@/api/google/userInfo'
import { AuthContext, type AuthStatus, type IAuthContextValue } from '@/features/auth/AuthContext'
import type { IUser } from '@/models/user'

/**
 * Access tokens are deliberately kept in memory only, so a reload drops them.
 * This flag is *not* a credential — it only records that a grant existed, so
 * first-time visitors are never subjected to a silent request that would
 * surface as a blocked popup.
 */
const SESSION_HINT_KEY = 'playpick.hasSession'

/** Renew a little before expiry so in-flight API calls do not race the clock. */
const TOKEN_RENEWAL_MARGIN_MS = 60_000

interface ISession {
  user: IUser
  accessToken: string
  expiresAt: number
}

function readSessionHint(): boolean {
  try {
    return localStorage.getItem(SESSION_HINT_KEY) === 'true'
  } catch {
    return false
  }
}

function writeSessionHint(hasSession: boolean): void {
  try {
    if (hasSession) localStorage.setItem(SESSION_HINT_KEY, 'true')
    else localStorage.removeItem(SESSION_HINT_KEY)
  } catch {
    // Storage can be unavailable; session restore is a convenience, not a requirement.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ISession | null>(null)
  const [status, setStatus] = useState<AuthStatus>(() => (readSessionHint() ? 'restoring' : 'unauthenticated'))
  const [error, setError] = useState<AuthErrorCode | null>(null)

  // Mirrors `session` so getAccessToken() can read the latest token without
  // being re-created on every sign-in (which would churn its consumers).
  const sessionRef = useRef<ISession | null>(null)
  const restoreAttempted = useRef(false)

  const applySession = useCallback((next: ISession | null) => {
    sessionRef.current = next
    setSession(next)
    writeSessionHint(next !== null)
  }, [])

  const establishSession = useCallback(
    async (mode: 'interactive' | 'silent'): Promise<ISession> => {
      const token: IAccessToken = await requestAccessToken(mode)
      const user = await fetchGoogleUser(token.accessToken)

      const next: ISession = {
        user,
        accessToken: token.accessToken,
        expiresAt: token.expiresAt,
      }

      applySession(next)

      return next
    },
    [applySession],
  )

  // Restore a previous grant on load. Guarded by a ref rather than an
  // abort flag so StrictMode's double-invoke does not discard the result.
  useEffect(() => {
    if (restoreAttempted.current) return
    restoreAttempted.current = true

    if (!readSessionHint()) return

    const restoreSession = async () => {
      try {
        await establishSession('silent')
        setStatus('authenticated')
      } catch {
        applySession(null)
        setStatus('unauthenticated')
      }
    }

    void restoreSession()
  }, [establishSession, applySession])

  const signIn = useCallback(async (): Promise<boolean> => {
    setError(null)
    setStatus('signingIn')

    try {
      await establishSession('interactive')
      setStatus('authenticated')

      return true
    } catch (cause) {
      applySession(null)
      setError(toAuthErrorCode(cause))
      setStatus('unauthenticated')

      return false
    }
  }, [establishSession, applySession])

  const signOut = useCallback(() => {
    const token = sessionRef.current?.accessToken

    applySession(null)
    setError(null)
    setStatus('unauthenticated')

    if (token) revokeAccessToken(token)
  }, [applySession])

  const getAccessToken = useCallback(async (): Promise<string> => {
    const current = sessionRef.current

    if (current && current.expiresAt - Date.now() > TOKEN_RENEWAL_MARGIN_MS) {
      return current.accessToken
    }

    try {
      const renewed = await establishSession('silent')

      return renewed.accessToken
    } catch (cause) {
      applySession(null)
      setError(toAuthErrorCode(cause))
      setStatus('unauthenticated')

      throw cause
    }
  }, [establishSession, applySession])

  const value = useMemo<IAuthContextValue>(
    () => ({
      status,
      user: session?.user ?? null,
      isAuthenticated: session !== null,
      error,
      signIn,
      signOut,
      getAccessToken,
    }),
    [status, session, error, signIn, signOut, getAccessToken],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
