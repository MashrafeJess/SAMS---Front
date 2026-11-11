import { useEffect, useRef } from 'react'
import { formatCountdown, msUntil, parseServerDate } from '../lib/time'
import { useNow } from '../lib/useNow'

/**
 * Live mm:ss until a hold expires. Fires `onExpire` exactly once on the tick
 * that crosses zero, so the parent can refetch instead of leaving a dead hold
 * on screen.
 */
export function Countdown({
  expiresAt,
  onExpire,
}: {
  expiresAt: string
  onExpire?: () => void
}) {
  useNow(1000)

  const expiry = parseServerDate(expiresAt)
  const remaining = msUntil(expiry)
  const expired = remaining <= 0

  const fired = useRef(false)
  useEffect(() => {
    if (expired && !fired.current) {
      fired.current = true
      onExpire?.()
    }
    if (!expired) fired.current = false
  }, [expired, onExpire])

  if (!expiry) return <span className="countdown countdown--unknown">no expiry</span>

  return (
    <span className={`countdown ${expired ? 'countdown--expired' : ''}`}>
      {expired ? 'Expired' : `${formatCountdown(remaining)} left`}
    </span>
  )
}
