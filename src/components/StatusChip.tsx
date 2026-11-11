import { HoldStatus } from '../api/types'

const TONE: Record<number, string> = {
  [HoldStatus.Pending]: 'pending',
  [HoldStatus.Held]: 'held',
  [HoldStatus.Released]: 'released',
  [HoldStatus.Confirmed]: 'confirmed',
}

export function StatusChip({ statusId, label }: { statusId: number; label: string }) {
  return <span className={`chip chip--${TONE[statusId] ?? 'released'}`}>{label}</span>
}
