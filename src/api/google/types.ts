/**
 * Minimal declarations for Google Identity Services OAuth2 token client.
 * https://developers.google.com/identity/oauth2/web/reference/js-reference
 */

export interface IGoogleTokenResponse {
  access_token: string
  expires_in: string | number
  scope: string
  token_type: string
  error?: string
  error_description?: string
}

export interface IGoogleErrorResponse {
  type: 'popup_failed_to_open' | 'popup_closed' | string
  message?: string
}

export type GooglePrompt = '' | 'none' | 'consent' | 'select_account'

export interface IGoogleTokenClientConfig {
  client_id: string
  scope: string
  prompt?: GooglePrompt
  callback: (response: IGoogleTokenResponse) => void
  error_callback?: (error: IGoogleErrorResponse) => void
}

export interface IGoogleTokenClient {
  requestAccessToken: (overrides?: { prompt?: GooglePrompt }) => void
}

export interface IGoogleIdentityServices {
  accounts: {
    oauth2: {
      initTokenClient: (config: IGoogleTokenClientConfig) => IGoogleTokenClient
      revoke: (accessToken: string, done?: () => void) => void
    }
  }
}

declare global {
  interface Window {
    google?: IGoogleIdentityServices
  }
}

export {}
