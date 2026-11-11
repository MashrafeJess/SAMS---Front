/**
 * Every SAMS endpoint, one function each. Route casing mirrors the C#
 * controllers exactly (ASP.NET routing is case-insensitive, but matching the
 * source makes the mapping obvious).
 */
import { envelope, http, query } from './client'
import type {
  ClassSummary,
  CreateClassRequest,
  CreateHoldRequest,
  Hold,
  LoginRequest,
  MeResponse,
  RegisterRequest,
} from './types'

const json = (body: unknown): RequestInit => ({
  method: 'POST',
  body: JSON.stringify(body),
})

/* ----------------------------------------------------------- AuthController */

export const auth = {
  /** Sets the `SAMS.Auth` cookie. Returns `{ message }` only -- no user object,
   *  so the caller must follow up with `auth.me()`. */
  login: (body: LoginRequest) => envelope<null>('/Auth/login', json(body)),

  logout: () => envelope<null>('/Auth/logout', { method: 'POST' }),

  /** The one endpoint that is NOT wrapped in `{ message, data }`. 401 when the
   *  cookie is missing or expired. */
  me: () => http<MeResponse>('/Auth/me'),

  /** Always creates a Common (student) user -- the API has no way to create an
   *  Admin, so the first admin has to be promoted directly in the database. */
  register: (body: RegisterRequest) =>
    envelope<{ userId: number; userName: string; email: string; roleName: string }>(
      '/Auth/AddStudent',
      json(body),
    ),
}

/* ---------------------------------------------------------- ClassController */

export const classes = {
  list: () => envelope<ClassSummary[]>('/Class/GetClassList'),

  /** Named "ByShift" but the service filters on `c.ClassId == classId`, so this
   *  returns a single class in a one-element array. */
  byId: (classId: number) =>
    envelope<ClassSummary[]>(`/Class/GetClassListByShift${query({ classId })}`),

  create: (body: CreateClassRequest) => envelope<unknown>('/Class/CreateClass', json(body)),
}

/* ----------------------------------------------------------- HoldController */

export const holds = {
  /** `CreateHold` is overloaded on `holdId`: 0 places a new hold, a real id
   *  confirms the existing one. Split into two named calls below so the intent
   *  is visible at the call site. */
  place: (classId: number, studentId: number) =>
    envelope<Hold>('/Hold/CreateHold', json({ holdId: 0, classId, studentId } satisfies CreateHoldRequest)),

  confirm: (hold: Pick<Hold, 'holdId' | 'classId' | 'studentId'>) =>
    envelope<Hold>(
      '/Hold/CreateHold',
      json({
        holdId: hold.holdId,
        classId: hold.classId,
        studentId: hold.studentId,
      } satisfies CreateHoldRequest),
    ),

  byId: (holdId: number) => envelope<Hold | null>(`/Hold/GetHoldById${query({ HoldId: holdId })}`),

  /** Takes the student id from the query string rather than the cookie, so the
   *  server will happily return someone else's holds. Front end cannot fix
   *  that; it just passes the signed-in user's own id. */
  listForStudent: (studentId: number) =>
    envelope<Hold[]>(`/Hold/me/holds${query({ StudentId: studentId })}`),

  release: (holdId: number) =>
    envelope<Hold>(`/Hold/DeleteHold${query({ HoldId: holdId })}`, { method: 'DELETE' }),
}
