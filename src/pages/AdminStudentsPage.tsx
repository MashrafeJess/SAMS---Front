import { useState } from 'react'
import { errorMessage } from '../api/client'
import { auth } from '../api/endpoints'
import { AdminTabs } from '../components/AdminTabs'
import { Banner } from '../components/Banner'
import { Field } from '../components/Field'

interface Created {
  userName: string
  email: string
  roleName: string
}

export function AdminStudentsPage() {
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // There is no endpoint that lists users, so the most this page can honestly
  // show is what it created during this session.
  const [created, setCreated] = useState<Created[]>([])

  async function submit() {
    if (password !== confirm) {
      setError('The two passwords do not match.')
      return
    }

    setBusy(true)
    setError(null)
    try {
      const result = await auth.register({ userName, email, password })
      // Deliberately NOT signing in as the new student the way /register does --
      // that would replace the admin's SAMS.Auth cookie with the student's and
      // silently demote whoever is sitting at this screen.
      setCreated((previous) => [
        {
          userName: result.data?.userName ?? userName,
          email: result.data?.email ?? email,
          roleName: result.data?.roleName ?? 'Common',
        },
        ...previous,
      ])
      setUserName('')
      setEmail('')
      setPassword('')
      setConfirm('')
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <h1 className="page__title">Students</h1>
          <p className="page__lead">
            Enrol a student directly, without making them register themselves.
          </p>
        </div>
      </header>

      <AdminTabs />

      {error ? (
        <Banner tone="error" title="Could not add the student" onDismiss={() => setError(null)}>
          {error}
        </Banner>
      ) : null}

      <section className="card">
        <h2 className="card__title">New student</h2>
        <form
          className="form"
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <div className="form-row">
            <Field
              label="Full name"
              required
              value={userName}
              placeholder="Ayesha Rahman"
              onChange={(event) => setUserName(event.target.value)}
            />
            <Field
              label="Email"
              type="email"
              required
              value={email}
              placeholder="ayesha@example.com"
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="form-row">
            <Field
              label="Temporary password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              hint="Share this with the student; the API has no password-reset endpoint."
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
          </div>

          <div className="form__footer">
            <button type="submit" className="button button--primary" disabled={busy}>
              {busy ? 'Adding...' : 'Add student'}
            </button>
            <p className="field__hint">
              Accounts are always created with the Student role. The API has no endpoint
              for granting Admin, so that is still a database change.
            </p>
          </div>
        </form>
      </section>

      {created.length > 0 ? (
        <section className="card table-card">
          <div className="card__head">
            <h2 className="card__title">Added in this session</h2>
            <span className="field__hint">
              SAMS exposes no endpoint for listing users, so this is not the full roster.
            </span>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Role</th>
              </tr>
            </thead>
            <tbody>
              {created.map((student) => (
                <tr key={student.email}>
                  <td data-label="Name">{student.userName}</td>
                  <td data-label="Email">{student.email}</td>
                  <td data-label="Role">
                    <span className="chip">{student.roleName === 'Admin' ? 'Admin' : 'Student'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </div>
  )
}
