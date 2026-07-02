import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Home } from './pages/Home';
import { Library } from './pages/Library';
import { Albums } from './pages/Albums';
import { Artists } from './pages/Artists';
import { Playlists } from './pages/Playlists';
import { Queue } from './pages/Queue';
import { Settings } from './pages/Settings';

import { AlbumDetails } from './pages/AlbumDetails';
import { ArtistDetails } from './pages/ArtistDetails';

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "library", element: <Library /> },
      { path: "albums", element: <Albums /> },
      { path: "album/:id", element: <AlbumDetails /> },
      { path: "artists", element: <Artists /> },
      { path: "artist/:id", element: <ArtistDetails /> },
      { path: "playlists", element: <Playlists /> },
      { path: "queue", element: <Queue /> },
      { path: "settings", element: <Settings /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ]
  }
]);

function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App;
