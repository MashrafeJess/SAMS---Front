import { useCallback, useState } from 'react'
import { errorMessage } from '../api/client'
import { classes, holds } from '../api/endpoints'
import type { ClassSummary, Hold } from '../api/types'
import { useSession } from '../auth/context'
import { Banner } from '../components/Banner'
import { ClassCard } from '../components/ClassCard'
import { SeatMeterLegend } from '../components/SeatMeter'
import { Spinner } from '../components/Spinner'
import { displayClassName } from '../lib/format'
import { pickHoldForClass } from '../lib/holds'
import { useResource } from '../lib/useResource'

interface Board {
  classList: ClassSummary[]
  myHolds: Hold[]
}

export function ClassesPage() {
  const session = useSession()
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyClassId, setBusyClassId] = useState<number | null>(null)

  // Stable identity: useResource re-runs whenever `load` changes.
  const load = useCallback(async (): Promise<Board> => {
    const [classResult, holdResult] = await Promise.all([
      classes.list(),
      holds.listForStudent(session.userId),
    ])
    return {
      classList: classResult.data ?? [],
      myHolds: holdResult.data ?? [],
    }
  }, [session.userId])

  const { data, error: loadError, loading, reload } = useResource(load)

  /** Runs an action, then refetches so seat counters and holds stay in sync. */
  const run = useCallback(
    async (classId: number, action: () => Promise<string>) => {
      setBusyClassId(classId)
      setError(null)
      setNotice(null)
      try {
        setNotice(await action())
      } catch (caught) {
        setError(errorMessage(caught))
      } finally {
        setBusyClassId(null)
        await reload()
      }
    },
    [reload],
  )

  const onHold = useCallback(
    (item: ClassSummary) =>
      void run(item.id, async () => {
        await holds.place(item.id, session.userId)
        return `Seat held in ${displayClassName(item.name)}. Confirm it within 5 minutes or it lapses.`
      }),
    [run, session.userId],
  )

  const onConfirm = useCallback(
    (item: ClassSummary, hold: Hold) =>
      void run(item.id, async () => {
        await holds.confirm(hold)
        return `Seat confirmed in ${displayClassName(item.name)}.`
      }),
    [run],
  )

  const onRelease = useCallback(
    (item: ClassSummary, hold: Hold) =>
      void run(item.id, async () => {
        await holds.release(hold.holdId)
        return `Hold on ${displayClassName(item.name)} released.`
      }),
    [run],
  )

  if (loading && !data) return <Spinner label="Loading classes" />

  const classList = data?.classList ?? []
  const myHolds = data?.myHolds ?? []

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <h1 className="page__title">Classes</h1>
          <p className="page__lead">
            Holding a seat reserves it for five minutes. Confirm within that window to keep it.
          </p>
        </div>
        <button type="button" className="button button--ghost" onClick={() => void reload()} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </header>

      {loadError ? (
        <Banner tone="error" title="Could not load the class list">
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

      {classList.length === 0 && !loadError ? (
        <p className="empty">No classes have been created yet.</p>
      ) : (
        <>
          <SeatMeterLegend />
          <div className="grid">
            {classList.map((item) => {
              const myHold = pickHoldForClass(myHolds, item.id)
              return (
                <ClassCard
                  key={item.id}
                  item={item}
                  myHold={myHold}
                  busy={busyClassId === item.id}
                  onHold={() => onHold(item)}
                  onConfirm={() => myHold && onConfirm(item, myHold)}
                  onRelease={() => myHold && onRelease(item, myHold)}
                  onHoldExpired={() => void reload()}
                />
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
