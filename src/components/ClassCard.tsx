import type { ClassSummary, Hold } from '../api/types'
import { displayClassName } from '../lib/format'
import { isConfirmed, isExpired } from '../lib/holds'
import { Countdown } from './Countdown'
import { SeatMeter } from './SeatMeter'

export function ClassCard({
  item,
  myHold,
  busy,
  onHold,
  onConfirm,
  onRelease,
  onHoldExpired,
}: {
  item: ClassSummary
  /** The signed-in student's hold on this class, if any. */
  myHold: Hold | null
  busy: boolean
  onHold: () => void
  onConfirm: () => void
  onRelease: () => void
  onHoldExpired: () => void
}) {
  // availableSeats is computed server-side as total - (held + confirmed), so it
  // can go negative once the counters drift. Never render "-2 seats free".
  const available = Math.max(0, item.availableSeats)
  const soldOut = available === 0
  const confirmed = myHold !== null && isConfirmed(myHold)
  const expired = myHold !== null && isExpired(myHold)

  return (
    <article className="card class-card">
      <header className="class-card__head">
        <h3 className="class-card__name">{displayClassName(item.name)}</h3>
        <span className={`pill ${soldOut ? 'pill--full' : 'pill--free'}`}>
          {soldOut ? 'Full' : `${available} free`}
        </span>
      </header>

      <SeatMeter total={item.totalSeats} confirmed={item.confirmedSeats} held={item.heldSeats} />

      <dl className="figures">
        <div className="figures__item">
          <dt>
            <span className="swatch swatch--confirmed" aria-hidden="true" />
            Confirmed
          </dt>
          <dd>{item.confirmedSeats}</dd>
        </div>
        <div className="figures__item">
          <dt>
            <span className="swatch swatch--held" aria-hidden="true" />
            Held
          </dt>
          <dd>{item.heldSeats}</dd>
        </div>
        <div className="figures__item">
          <dt>
            <span className="swatch swatch--available" aria-hidden="true" />
            Available
          </dt>
          <dd>{available}</dd>
        </div>
        <div className="figures__item">
          <dt>Total</dt>
          <dd>{item.totalSeats}</dd>
        </div>
      </dl>

      <footer className="class-card__actions">
        {confirmed ? (
          <span className="class-card__state class-card__state--ok">Your seat is confirmed</span>
        ) : expired && myHold ? (
          <>
            <Countdown expiresAt={myHold.expiresAt} />
            <div className="button-row">
              <button type="button" className="button button--ghost" disabled={busy} onClick={onRelease}>
                Release expired hold
              </button>
            </div>
          </>
        ) : myHold ? (
          <>
            <Countdown expiresAt={myHold.expiresAt} onExpire={onHoldExpired} />
            <div className="button-row">
              <button type="button" className="button button--primary" disabled={busy} onClick={onConfirm}>
                Confirm seat
              </button>
              <button type="button" className="button button--ghost" disabled={busy} onClick={onRelease}>
                Release
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            className="button button--primary"
            disabled={busy || soldOut}
            onClick={onHold}
          >
            {soldOut ? 'No seats left' : 'Hold a seat'}
          </button>
        )}
      </footer>
    </article>
  )
}
