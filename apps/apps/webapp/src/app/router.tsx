import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { BootPage } from '../pages/BootPage'
import { HomePage } from '../pages/HomePage'
import { ErrorPage } from '../pages/ErrorPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <BootPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/home',
    element: <HomePage />,
    errorElement: <ErrorPage />,
  },
  {
    path: '*',
    element: <ErrorPage message="Страница не найдена" />,
  },
])

export function Router() {
  return <RouterProvider router={router} />
}