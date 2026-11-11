import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { errorMessage } from '../api/client'
import { auth } from '../api/endpoints'
import { useAuth } from '../auth/context'
import { Banner } from '../components/Banner'
import { Field } from '../components/Field'

export function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (password !== confirm) {
      setError('The two passwords do not match.')
      return
    }

    setBusy(true)
    setError(null)
    try {
      await auth.register({ userName, email, password })
      // AddStudent does not issue a cookie, so sign in with the same
      // credentials to land the student straight on the class list.
      try {
        await login({ email, password, rememberMe: false })
        void navigate('/classes', { replace: true })
      } catch {
        void navigate('/login', {
          replace: true,
          state: { notice: 'Account created. Please sign in.' },
        })
      }
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <section className="card auth-card">
        <h1 className="auth-card__title">Create a student account</h1>
        <p className="auth-card__lead">
          Every account created here is a student. Admin access is granted in the database.
        </p>

        {error ? (
          <Banner tone="error" title="Could not create the account" onDismiss={() => setError(null)}>
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
            label="Full name"
            name="userName"
            autoComplete="name"
            required
            value={userName}
            onChange={(event) => setUserName(event.target.value)}
          />
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
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Field
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />

          <button type="submit" className="button button--primary button--block" disabled={busy}>
            {busy ? 'Creating...' : 'Create account'}
          </button>
        </form>

        <p className="auth-card__alt">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </div>
  )
}
