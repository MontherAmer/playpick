import { createBrowserRouter, Navigate } from 'react-router-dom'

import { LandingPage } from '@/components/landing/landing-page'
import { BuildPlaylistPage } from '@/pages/tools/build-playlist-page'
import { ComparePlaylistsPage } from '@/pages/tools/compare-playlists-page'
import { CopyVideosPage } from '@/pages/tools/copy-videos-page'
import { DuplicatePlaylistPage } from '@/pages/tools/duplicate-playlist-page'
import { LibraryInsightsPage } from '@/pages/tools/library-insights-page'
import { MergePlaylistsPage } from '@/pages/tools/merge-playlists-page'
import { MoveVideosPage } from '@/pages/tools/move-videos-page'
import { PlaylistCleanerPage } from '@/pages/tools/playlist-cleaner-page'
import { RenameNumberPage } from '@/pages/tools/rename-number-page'
import { ReorderPlaylistPage } from '@/pages/tools/reorder-playlist-page'
import { ROUTES } from '@/routes'

export const router = createBrowserRouter(
  [
    { path: ROUTES.landing, element: <LandingPage /> },
    { path: ROUTES.tools.copy, element: <CopyVideosPage /> },
    { path: ROUTES.tools.move, element: <MoveVideosPage /> },
    { path: ROUTES.tools.build, element: <BuildPlaylistPage /> },
    { path: ROUTES.tools.merge, element: <MergePlaylistsPage /> },
    { path: ROUTES.tools.duplicate, element: <DuplicatePlaylistPage /> },
    { path: ROUTES.tools.reorder, element: <ReorderPlaylistPage /> },
    { path: ROUTES.tools.rename, element: <RenameNumberPage /> },
    { path: ROUTES.tools.compare, element: <ComparePlaylistsPage /> },
    { path: ROUTES.tools.cleaner, element: <PlaylistCleanerPage /> },
    { path: ROUTES.tools.insights, element: <LibraryInsightsPage /> },
    { path: '*', element: <Navigate to={ROUTES.landing} replace /> },
  ],
  { basename: import.meta.env.BASE_URL },
)
