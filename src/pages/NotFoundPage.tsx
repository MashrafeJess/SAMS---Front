import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="page empty-page">
      <h1 className="page__title">Page not found</h1>
      <p className="page__lead">That route does not exist in SAMS.</p>
      <Link className="button button--primary" to="/classes">
        Back to classes
      </Link>
    </div>
  )
}
