import type { LoaderFunctionArgs, RouteObject } from 'react-router-dom'
import Layout from '../../Pages/Layout'
import AppLayout from '../../Components/AppLayout'
import Login from '../../Pages/Login'
import Home from '../../Pages/Home'
import Favourites from '../../Pages/Favourites.tsx';
import CreateReflection from '../../Pages/CreateReflection';
import useProfile from '../../Stores/Profile.ts';
import Register from '../../Pages/Register'
import { redirect } from 'react-router-dom'


const publicPaths = new Set(['/', '/login', '/register'])

async function isAuthenticated(): Promise<boolean> {
  try {
    await useProfile.getState().fetchProfile()
    return Boolean(useProfile.getState().userId)
  } catch {
    return false
  }
}

async function authMiddleware({ request }: LoaderFunctionArgs) {
  const pathname = new URL(request.url).pathname
  const isPublicRoute = publicPaths.has(pathname)
  const authenticated = await isAuthenticated()

  if (authenticated && isPublicRoute) {
    return redirect('/home')
  }

  if (!authenticated && !isPublicRoute) {
    return redirect('/login')
  }

  return null
}

export const routeObject: RouteObject[] = [
  {
    path: '/',
    Component: Layout,
    children: [
      {
        index: true,
        Component: Login,
      },
      {
        path: 'login',
        Component: Login,
      },
      {
        path: 'register',
        Component: Register,
      },  
      {
        Component: AppLayout, // no path → acts like a root boundary
        loader: authMiddleware,
        children: [
          {
            path: 'home',
            Component: Home,
          },
          {
            path: 'favourites',
            Component: Favourites,
          },    
          {
            path:'create-reflection',
            Component: CreateReflection, 
          },
          {
            path: 'favorites',
            loader: () => redirect('/favourites'),
          },
        ],
      },
    ],
    loader: authMiddleware,
  },
]

export default routeObject
