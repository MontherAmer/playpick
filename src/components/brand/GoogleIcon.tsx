interface GoogleIconProps {
  className?: string
}

/** Google's official four-colour mark. Not available in lucide, so inlined. */
export function GoogleIcon({ className }: GoogleIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 5.04c1.62 0 3.06.56 4.2 1.64l3.12-3.12C17.46 1.8 14.96.75 12 .75 7.31.75 3.26 3.38 1.28 7.15l3.65 2.83C5.92 7.28 8.72 5.04 12 5.04z"
      />
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path fill="#FBBC05" d="M5.06 14.29a7.9 7.9 0 0 1 0-4.58L1.41 6.98a11.9 11.9 0 0 0 0 10.04l3.65-2.73z" />
      <path
        fill="#34A853"
        d="M12 23.25c3.24 0 5.96-1.08 7.94-2.91l-3.86-3c-1.08.72-2.45 1.16-4.08 1.16-3.27 0-6.08-2.24-7.08-5.28l-3.65 2.83c1.98 3.77 6.03 6.2 10.73 6.2z"
      />
    </svg>
  )
}
