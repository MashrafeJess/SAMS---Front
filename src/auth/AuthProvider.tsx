import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ApiError } from '../api/client'
import { auth } from '../api/endpoints'
import type { LoginRequest, MeResponse, Session } from '../api/types'
import { AuthContext } from './context'
import type { AuthState } from './context'

/**
 * `/Auth/me` reads claims, so every field can be null. Anything we cannot turn
 * into a usable session counts as signed out.
 */
function toSession(me: MeResponse | null): Session | null {
  if (!me) return null
  const userId = Number(me.userId)
  if (!Number.isFinite(userId) || userId <= 0) return null

  const role = me.role ?? 'Common'
  return {
    userId,
    userName: me.userName ?? me.email ?? 'User',
    email: me.email ?? '',
    role,
    // Users.RoleName stores the enum member name, so it is literally "Admin" or
    // "Common" -- the [Description("Student")] attribute is never read.
    isAdmin: role.toLowerCase() === 'admin',
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')

  const refresh = useCallback(async () => {
    try {
      setSession(toSession(await auth.me()))
    } catch (error) {
      // 401 is the normal "not signed in" answer, not a failure worth surfacing.
      if (error instanceof ApiError && error.status === 401) {
        setSession(null)
      } else {
        setSession(null)
        if (import.meta.env.DEV) console.warn('[auth] /Auth/me failed:', error)
      }
    } finally {
      setStatus('ready')
    }
  }, [])

  useEffect(() => {
    // refresh() only writes state after `await auth.me()` settles, so nothing
    // is set synchronously in this effect body. The rule flags any transitive
    // setState and cannot see across the await boundary.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh()
  }, [refresh])

  const login = useCallback(
    async (request: LoginRequest) => {
      // Login only sets the cookie and returns a message, so read the identity back.
      await auth.login(request)
      await refresh()
    },
    [refresh],
  )

  const logout = useCallback(async () => {
    try {
      await auth.logout()
    } finally {
      setSession(null)
    }
  }, [])

  const value = useMemo<AuthState>(
    () => ({ session, status, login, logout, refresh }),
    [session, status, login, logout, refresh],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
