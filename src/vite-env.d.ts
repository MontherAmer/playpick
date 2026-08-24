/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Google OAuth *client id* — a public value, safe to ship in the bundle.
   * Never put the client secret in a VITE_* variable.
   */
  readonly VITE_GOOGLE_CLIENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
