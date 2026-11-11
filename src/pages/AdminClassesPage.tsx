import { useCallback, useState } from 'react'
import { errorMessage } from '../api/client'
import { classes } from '../api/endpoints'
import { AdminTabs } from '../components/AdminTabs'
import { Banner } from '../components/Banner'
import { displayClassName } from '../lib/format'
import { Field } from '../components/Field'
import { SeatMeter, SeatMeterLegend } from '../components/SeatMeter'
import { Spinner } from '../components/Spinner'
import { useResource } from '../lib/useResource'

export function AdminClassesPage() {
  const [className, setClassName] = useState('')
  const [shiftId, setShiftId] = useState('1')
  const [totalSeats, setTotalSeats] = useState('30')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => (await classes.list()).data ?? [], [])
  const { data, error: loadError, loading, reload } = useResource(load)

  async function submit() {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await classes.create({
        className,
        shiftId: Number(shiftId),
        totalSeats: Number(totalSeats),
        // CreateClass hard-codes both of these to 0 server-side; sent only to
        // satisfy the DTO shape.
        holdNumber: 0,
        confirmedSeat: 0,
      })
      setNotice(`Created "${className}".`)
      setClassName('')
      await reload()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  const classList = data ?? []

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <h1 className="page__title">Manage classes</h1>
          <p className="page__lead">Create classes and watch seat usage across every shift.</p>
        </div>
        <button type="button" className="button button--ghost" onClick={() => void reload()} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </header>

      <AdminTabs />

      {error ? (
        <Banner tone="error" title="Could not create the class" onDismiss={() => setError(null)}>
          {error}
        </Banner>
      ) : null}
      {notice ? (
        <Banner tone="success" onDismiss={() => setNotice(null)}>
          {notice}
        </Banner>
      ) : null}

      <section className="card">
        <h2 className="card__title">New class</h2>
        <form
          className="form form--inline"
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <Field
            label="Class name"
            required
            value={className}
            placeholder="Data Structures"
            onChange={(event) => setClassName(event.target.value)}
          />
          <Field
            label="Shift ID"
            type="number"
            min={1}
            required
            value={shiftId}
            hint="Typed by hand: the API exposes no endpoint for listing shifts."
            onChange={(event) => setShiftId(event.target.value)}
          />
          <Field
            label="Total seats"
            type="number"
            min={1}
            required
            value={totalSeats}
            onChange={(event) => setTotalSeats(event.target.value)}
          />
          <button type="submit" className="button button--primary" disabled={busy}>
            {busy ? 'Creating...' : 'Create class'}
          </button>
        </form>
      </section>

      {loadError ? (
        <Banner tone="error" title="Could not load the class list">
          {loadError}
        </Banner>
      ) : null}

      {loading && !data ? (
        <Spinner label="Loading classes" />
      ) : classList.length === 0 && !loadError ? (
        <p className="empty">No classes yet. Create the first one above.</p>
      ) : (
        <section className="card table-card">
          <div className="card__head">
            <h2 className="card__title">All classes</h2>
            <SeatMeterLegend />
          </div>
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Class</th>
                <th scope="col">Usage</th>
                <th scope="col">Confirmed</th>
                <th scope="col">Held</th>
                <th scope="col">Available</th>
                <th scope="col">Total</th>
              </tr>
            </thead>
            <tbody>
              {classList.map((item) => (
                <tr key={item.id}>
                  <td data-label="Class">{displayClassName(item.name)}</td>
                  <td data-label="Usage" className="table__meter">
                    <SeatMeter
                      total={item.totalSeats}
                      confirmed={item.confirmedSeats}
                      held={item.heldSeats}
                    />
                  </td>
                  <td data-label="Confirmed">{item.confirmedSeats}</td>
                  <td data-label="Held">{item.heldSeats}</td>
                  <td data-label="Available">{Math.max(0, item.availableSeats)}</td>
                  <td data-label="Total">{item.totalSeats}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}
