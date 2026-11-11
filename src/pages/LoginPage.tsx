import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { errorMessage } from '../api/client'
import { useAuth } from '../auth/context'
import { Banner } from '../components/Banner'
import { Field } from '../components/Field'

interface LocationState {
  from?: string
  notice?: string
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state ?? null) as LocationState | null

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      await login({ email, password, rememberMe })
      void navigate(state?.from ?? '/classes', { replace: true })
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <section className="card auth-card">
        <h1 className="auth-card__title">Sign in</h1>
        <p className="auth-card__lead">Use your SAMS student account to hold and confirm seats.</p>

        {state?.notice ? <Banner tone="success">{state.notice}</Banner> : null}
        {error ? (
          <Banner tone="error" title="Could not sign in" onDismiss={() => setError(null)}>
            {error}
          </Banner>
        ) : null}

        <form
          className="form"
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <Field
            label="Email"
            type="email"
            name="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Field
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <label className="checkbox">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            <span>
              Keep me signed in
              <em>Persists the SAMS.Auth cookie to disk instead of ending it with the browser session.</em>
            </span>
          </label>

          <button type="submit" className="button button--primary button--block" disabled={busy}>
            {busy ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="auth-card__alt">
          No account yet? <Link to="/register">Create a student account</Link>
        </p>
      </section>
    </div>
  )
}
