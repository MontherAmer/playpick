export const ROUTES = {
  landing: '/',
  dashboard: '/dashboard',
  /**
   * Canonical address of every tool, recorded whether or not it is currently
   * reachable. Recording an address is not the same as serving it: `router.tsx`
   * registers none of these, so a tool URL entered directly falls through to the
   * not-found screen until that tool's page is delivered.
   */
  tools: {
    reorder: '/tools/reorder',
    copy: '/tools/copy',
    create: '/tools/create',
    build: '/tools/build',
    merge: '/tools/merge',
    duplicate: '/tools/duplicate',
  },
} as const
