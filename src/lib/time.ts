/**
 * The API stores `CreatedDate`/`ExpiresAt` as `DateTime.UtcNow`. Npgsql maps a
 * UTC DateTime to `timestamptz`, so System.Text.Json normally writes a trailing
 * "Z". If that ever changes -- e.g. a column migrates to plain `timestamp`, or
 * someone swaps in `DateTime.Now` -- the string arrives without an offset, and
 * `new Date(...)` would silently read it as *local* time. Pin it to UTC so a
 * five-minute hold never looks six hours old.
 */
export function parseServerDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)
  const date = new Date(hasZone ? value : `${value}Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Milliseconds from now until `date`; negative once it has passed. */
export function msUntil(date: Date | null): number {
  return date ? date.getTime() - Date.now() : 0
}

/** 125_000 -> "2:05". Clamps at zero. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function formatDateTime(value: string | null | undefined): string {
  const date = parseServerDate(value)
  return date ? date.toLocaleString() : '--'
}
