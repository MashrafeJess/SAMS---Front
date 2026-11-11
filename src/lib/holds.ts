import { HoldStatus } from '../api/types'
import type { Hold } from '../api/types'
import { msUntil, parseServerDate } from './time'

export function isConfirmed(hold: Hold): boolean {
  return hold.holdStatusId === HoldStatus.Confirmed
}

/** Placed but not yet confirmed, regardless of the clock. */
export function isActive(hold: Hold): boolean {
  return hold.holdStatusId === HoldStatus.Held || hold.holdStatusId === HoldStatus.Pending
}

export function isReleased(hold: Hold): boolean {
  return hold.holdStatusId === HoldStatus.Released
}

export function isExpired(hold: Hold): boolean {
  return isActive(hold) && msUntil(parseServerDate(hold.expiresAt)) <= 0
}

function newest(a: Hold, b: Hold): Hold {
  return b.holdId > a.holdId ? b : a
}

/**
 * The one hold that should drive this class's card.
 *
 * A confirmed seat always wins -- once you hold a seat you are done, and any
 * older pending row is noise. Otherwise the most recent still-active hold.
 * Nothing filters expired holds out here: the server has no job that releases
 * them, so they keep occupying `Class.HoldNumber` and the student still needs a
 * way to let one go.
 */
export function pickHoldForClass(holds: Hold[], classId: number): Hold | null {
  const mine = holds.filter((hold) => hold.classId === classId)
  const confirmed = mine.filter(isConfirmed)
  if (confirmed.length > 0) return confirmed.reduce(newest)

  const active = mine.filter(isActive)
  return active.length > 0 ? active.reduce(newest) : null
}
