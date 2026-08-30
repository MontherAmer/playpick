import { createBrowserRouter } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { LandingPage } from '@/pages/LandingPage'
import { CopyPlaylistsPage } from '@/pages/CopyPlaylistsPage'
import { BuildPlaylistPage } from '@/pages/BuildPlaylistPage'
import { DuplicatePlaylistPage } from '@/pages/DuplicatePlaylistPage'
import { MergePlaylistsPage } from '@/pages/MergePlaylistsPage'
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
        // Every tool PlayPick offers. `toolCatalog.ts` and this list must
        // move together: a tool advertised as available whose path is not
        // registered here is a broken link on the dashboard.
        { path: ROUTES.tools.reorder, element: <ReorderPlaylistPage /> },
        { path: ROUTES.tools.copy, element: <CopyPlaylistsPage /> },
        { path: ROUTES.tools.create, element: <CreatePlaylistPage /> },
        { path: ROUTES.tools.build, element: <BuildPlaylistPage /> },
        { path: ROUTES.tools.merge, element: <MergePlaylistsPage /> },
        { path: ROUTES.tools.duplicate, element: <DuplicatePlaylistPage /> },
      ],
    },
    { path: '*', element: <NotFoundPage /> },
  ],
  // Honours the Vite `base` setting, so a GitHub Pages project page works unchanged.
  { basename: import.meta.env.BASE_URL },
)
