import { useCallback, useState } from 'react'
import { errorMessage } from '../api/client'
import { classes, holds } from '../api/endpoints'
import type { ClassSummary, Hold } from '../api/types'
import { useSession } from '../auth/context'
import { Banner } from '../components/Banner'
import { Countdown } from '../components/Countdown'
import { Spinner } from '../components/Spinner'
import { StatusChip } from '../components/StatusChip'
import { displayClassName } from '../lib/format'
import { isActive, isConfirmed, isExpired, isReleased } from '../lib/holds'
import { formatDateTime } from '../lib/time'
import { useResource } from '../lib/useResource'

export function MyHoldsPage() {
  const session = useSession()
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busyHoldId, setBusyHoldId] = useState<number | null>(null)

  const load = useCallback(async () => {
    const [holdResult, classResult] = await Promise.all([
      holds.listForStudent(session.userId),
      classes.list(),
    ])
    return {
      myHolds: holdResult.data ?? [],
      classList: classResult.data ?? [],
    }
  }, [session.userId])

  const { data, error: loadError, loading, reload } = useResource(load)

  const run = useCallback(
    async (holdId: number, action: () => Promise<string>) => {
      setBusyHoldId(holdId)
      setError(null)
      setNotice(null)
      try {
        setNotice(await action())
      } catch (caught) {
        setError(errorMessage(caught))
      } finally {
        setBusyHoldId(null)
        await reload()
      }
    },
    [reload],
  )

  if (loading && !data) return <Spinner label="Loading your holds" />

  const myHolds = data?.myHolds ?? []
  const classList: ClassSummary[] = data?.classList ?? []
  const nameOf = (classId: number) => {
    const found = classList.find((item) => item.id === classId)
    return found ? displayClassName(found.name) : `Class #${classId}`
  }

  // Newest first -- the hold you just placed is the one you came here to act on.
  const ordered = [...myHolds].sort((a, b) => b.holdId - a.holdId)

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <h1 className="page__title">My holds</h1>
          <p className="page__lead">Every seat you have held or confirmed, newest first.</p>
        </div>
        <button type="button" className="button button--ghost" onClick={() => void reload()} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </header>

      {loadError ? (
        <Banner tone="error" title="Could not load your holds">
          {loadError}
        </Banner>
      ) : null}
      {error ? (
        <Banner tone="error" onDismiss={() => setError(null)}>
          {error}
        </Banner>
      ) : null}
      {notice ? (
        <Banner tone="success" onDismiss={() => setNotice(null)}>
          {notice}
        </Banner>
      ) : null}

      {ordered.length === 0 && !loadError ? (
        <p className="empty">You have not held any seats yet.</p>
      ) : (
        <div className="card table-card">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Class</th>
                <th scope="col">Status</th>
                <th scope="col">Placed</th>
                <th scope="col">Expires</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((hold: Hold) => {
                const busy = busyHoldId === hold.holdId
                const expired = isExpired(hold)
                return (
                  <tr key={hold.holdId}>
                    <td data-label="Class">{nameOf(hold.classId)}</td>
                    <td data-label="Status">
                      <StatusChip statusId={hold.holdStatusId} label={hold.holdStatusName} />
                    </td>
                    <td data-label="Placed">{formatDateTime(hold.createdDate)}</td>
                    <td data-label="Expires">
                      {isConfirmed(hold) ? (
                        <span className="muted">--</span>
                      ) : (
                        <Countdown expiresAt={hold.expiresAt} />
                      )}
                    </td>
                    <td data-label="Actions" className="table__actions">
                      {isActive(hold) ? (
                        <>
                          {!expired ? (
                            <button
                              type="button"
                              className="button button--primary button--sm"
                              disabled={busy}
                              onClick={() =>
                                void run(hold.holdId, async () => {
                                  await holds.confirm(hold)
                                  return `Seat confirmed in ${nameOf(hold.classId)}.`
                                })
                              }
                            >
                              Confirm
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="button button--ghost button--sm"
                            disabled={busy}
                            onClick={() =>
                              void run(hold.holdId, async () => {
                                await holds.release(hold.holdId)
                                return `Hold on ${nameOf(hold.classId)} released.`
                              })
                            }
                          >
                            Release
                          </button>
                        </>
                      ) : isReleased(hold) ? (
                        <button
                          type="button"
                          className="button button--ghost button--sm"
                          disabled={busy}
                          onClick={() =>
                            void run(hold.holdId, async () => {
                              await holds.release(hold.holdId)
                              return `Removed the lapsed hold on ${nameOf(hold.classId)}.`
                            })
                          }
                        >
                          Remove
                        </button>
                      ) : (
                        <span className="muted">--</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
