import { useCallback, useEffect, useRef, useState } from 'react'
import { errorMessage } from '../api/client'

export interface Resource<T> {
  data: T | null
  error: string | null
  loading: boolean
  reload: () => Promise<void>
}

/**
 * Load-on-mount with manual reload.
 *
 * `load` must be stable -- wrap it in `useCallback` at the call site, otherwise
 * a fresh function identity every render re-triggers the effect forever.
 *
 * The generation counter guards two things: StrictMode runs effects twice in
 * development, and a slow first request can resolve after a fast reload. Only
 * the newest call is allowed to write state.
 */
export function useResource<T>(load: () => Promise<T>): Resource<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Starts true so the first paint is the spinner without an effect having to
  // flip it -- see the effect below.
  const [loading, setLoading] = useState(true)
  const generation = useRef(0)

  const settle = useCallback(async () => {
    const current = ++generation.current
    try {
      const result = await load()
      if (generation.current === current) {
        setData(result)
        setError(null)
      }
    } catch (caught) {
      if (generation.current === current) setError(errorMessage(caught))
    } finally {
      if (generation.current === current) setLoading(false)
    }
  }, [load])

  /** For buttons and post-action refetches, where a visible spinner is wanted. */
  const reload = useCallback(async () => {
    setLoading(true)
    await settle()
  }, [settle])

  useEffect(() => {
    // Nothing sets state synchronously here: `loading` already starts true and
    // every write inside settle() happens after the await. Flipping state in an
    // effect body would make React render, commit, then immediately re-render.
    // settle() only writes state after `await load()`, so nothing is set
    // synchronously in this effect body. The rule flags any transitive
    // setState and cannot see across the await boundary.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void settle()
  }, [settle])

  return { data, error, loading, reload }
}
