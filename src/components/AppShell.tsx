import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/context'

export function AppShell() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  async function handleLogout() {
    await logout()
    void navigate('/login', { replace: true })
  }

  return (
    <div className="shell">
      <header className="shell__bar">
        <div className="shell__brand">
          <span className="shell__mark" aria-hidden="true" />
          <span>
            SAMS<span className="shell__brand-sub">Seat Allocation</span>
          </span>
        </div>

        {session ? (
          <nav className="shell__nav" aria-label="Main">
            <NavLink to="/classes">Classes</NavLink>
            <NavLink to="/my-holds">My holds</NavLink>
            {session.isAdmin ? (
              // A plain string className opts out of NavLink's exact-path matching,
              // so "Admin" stays lit on every /admin/* sub-page.
              <NavLink to="/admin/classes" className={pathname.startsWith('/admin') ? 'active' : undefined}>
                Admin
              </NavLink>
            ) : null}
          </nav>
        ) : null}

        {session ? (
          <div className="shell__user">
            <span className="shell__who">
              {session.userName}
              <span className="shell__role">{session.isAdmin ? 'Admin' : 'Student'}</span>
            </span>
            <button type="button" className="button button--ghost" onClick={() => void handleLogout()}>
              Sign out
            </button>
          </div>
        ) : null}
      </header>

      <main className="shell__main">
        <Outlet />
      </main>

      <footer className="shell__foot">
        SAMS front end &middot; talks to the WebAPI through the Vite <code>/api</code> proxy
      </footer>
    </div>
  )
}
