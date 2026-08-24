/**
 * Every code maps to an `errors.auth.<code>` translation key, so new codes must
 * be added to both locale files.
 */
export type AuthErrorCode =
  | 'missingClientId'
  | 'scriptUnavailable'
  | 'popupBlocked'
  | 'popupClosed'
  | 'accessDenied'
  | 'profileUnavailable'
  | 'unknown'

export class AuthError extends Error {
  readonly code: AuthErrorCode

  constructor(code: AuthErrorCode, message?: string) {
    super(message ?? code)

    this.name = 'AuthError'
    this.code = code
  }
}

export function toAuthErrorCode(error: unknown): AuthErrorCode {
  return error instanceof AuthError ? error.code : 'unknown'
}
