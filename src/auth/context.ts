import { createContext, use } from 'react'
import type { LoginRequest, Session } from '../api/types'

export interface AuthState {
  /** Null when signed out. */
  session: Session | null
  /** 'loading' only during the very first `/Auth/me` probe. */
  status: 'loading' | 'ready'
  login: (request: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  /** Re-reads `/Auth/me`. */
  refresh: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const value = use(AuthContext)
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>')
  return value
}

/** Narrowed accessor for the many places that require a signed-in user. */
export function useSession(): Session {
  const { session } = useAuth()
  if (!session) throw new Error('useSession used outside a protected route')
  return session
}
