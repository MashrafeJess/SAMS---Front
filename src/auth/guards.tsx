import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Spinner } from '../components/Spinner'
import { useAuth } from './context'

/** Blocks a route until `/Auth/me` has answered, then requires a session. */
export function RequireAuth() {
  const { session, status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <Spinner label="Checking your session" />
  if (!session) {
    // Remember where they were headed so login can send them back.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

/** Requires `RoleName == "Admin"`. Nest inside <RequireAuth>. */
export function RequireAdmin() {
  const { session, status } = useAuth()

  if (status === 'loading') return <Spinner label="Checking your session" />
  if (!session) return <Navigate to="/login" replace />
  if (!session.isAdmin) return <Navigate to="/classes" replace />
  return <Outlet />
}

/** Keeps signed-in users off /login and /register. */
export function RedirectIfAuthenticated() {
  const { session, status } = useAuth()

  if (status === 'loading') return <Spinner label="Checking your session" />
  if (session) return <Navigate to="/classes" replace />
  return <Outlet />
}
