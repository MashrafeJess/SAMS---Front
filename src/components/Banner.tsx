import type { ReactNode } from 'react'

export type BannerTone = 'error' | 'success' | 'info' | 'warning'

export function Banner({
  tone = 'info',
  title,
  children,
  onDismiss,
}: {
  tone?: BannerTone
  title?: string
  children: ReactNode
  onDismiss?: () => void
}) {
  return (
    <div
      className={`banner banner--${tone}`}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
    >
      <div className="banner__body">
        {title ? <strong className="banner__title">{title}</strong> : null}
        <span>{children}</span>
      </div>
      {onDismiss ? (
        <button type="button" className="banner__close" onClick={onDismiss} aria-label="Dismiss">
          &times;
        </button>
      ) : null}
    </div>
  )
}
