import { createBrowserRouter } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { LandingPage } from '@/pages/LandingPage'
import { CopyPlaylistsPage } from '@/pages/CopyPlaylistsPage'
import { BuildPlaylistPage } from '@/pages/BuildPlaylistPage'
import { CreatePlaylistPage } from '@/pages/CreatePlaylistPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ReorderPlaylistPage } from '@/pages/ReorderPlaylistPage'
import { ROUTES } from '@/routes'

export const router = createBrowserRouter(
  [
    { path: ROUTES.landing, element: <LandingPage /> },
    {
      element: <AppLayout />,
      children: [
        { path: ROUTES.dashboard, element: <DashboardPage /> },
        // The tools served so far. The remaining three keep their recorded
        // addresses in ROUTES.tools and stay unregistered, so entering one
        // still falls through to the catch-all below.
        { path: ROUTES.tools.reorder, element: <ReorderPlaylistPage /> },
        { path: ROUTES.tools.copy, element: <CopyPlaylistsPage /> },
        { path: ROUTES.tools.create, element: <CreatePlaylistPage /> },
        { path: ROUTES.tools.build, element: <BuildPlaylistPage /> },
      ],
    },
    { path: '*', element: <NotFoundPage /> },
  ],
  // Honours the Vite `base` setting, so a GitHub Pages project page works unchanged.
  { basename: import.meta.env.BASE_URL },
)
