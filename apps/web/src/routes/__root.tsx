import { createRootRoute, Outlet } from '@tanstack/react-router'
import { useAuth } from '../providers/AuthProvider'
import { Login } from '../components/Login'

export const Route = createRootRoute({
  component: () => {
    const { user } = useAuth()

    return (
      <>
        {/* Basic Auth Guard at Root Level */}
        {!user ? <Login /> : <Outlet />}
      </>
    )
  },
})
