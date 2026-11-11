/**
 * Thin segmented bar: one whole (total seats) split into confirmed / held /
 * available, read alongside the figures printed next to it.
 *
 * Deliberately carries no text of its own -- the figure list beside it already
 * names and counts every part, so labelling the bar would just duplicate it.
 * For the same reason the bar is aria-hidden: screen readers get the numbers
 * from the list, not twice.
 *
 * Colours are categorical slots 1 (blue) and 2 (orange); "available" is the
 * neutral track rather than a third hue, because empty capacity is the absence
 * of a booking, not a third kind of thing. The 2px gaps between fills are the
 * surface showing through, which keeps adjacent segments separable without a
 * border.
 */
export function SeatMeter({
  total,
  confirmed,
  held,
}: {
  total: number
  confirmed: number
  held: number
}) {
  const safeTotal = Math.max(0, total)
  const percent = (value: number) =>
    safeTotal > 0 ? `${Math.min(100, Math.max(0, (value / safeTotal) * 100))}%` : '0%'

  return (
    <div className="meter" aria-hidden="true">
      {confirmed > 0 ? (
        <span className="meter__fill meter__fill--confirmed" style={{ width: percent(confirmed) }} />
      ) : null}
      {held > 0 ? (
        <span className="meter__fill meter__fill--held" style={{ width: percent(held) }} />
      ) : null}
    </div>
  )
}

/** One legend for a whole list of meters -- not one per card. */
export function SeatMeterLegend() {
  return (
    <ul className="legend">
      <li>
        <span className="swatch swatch--confirmed" aria-hidden="true" />
        Confirmed
      </li>
      <li>
        <span className="swatch swatch--held" aria-hidden="true" />
        Held
      </li>
      <li>
        <span className="swatch swatch--available" aria-hidden="true" />
        Available
      </li>
    </ul>
  )
}
