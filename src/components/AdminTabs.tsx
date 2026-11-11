import { NavLink } from 'react-router-dom'

/** Sub-navigation for the admin area, so the top bar keeps a single entry. */
export function AdminTabs() {
  return (
    <nav className="tabs" aria-label="Admin sections">
      <NavLink to="/admin/classes">Classes</NavLink>
      <NavLink to="/admin/students">Students</NavLink>
    </nav>
  )
}
