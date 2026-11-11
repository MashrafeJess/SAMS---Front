/**
 * Shapes returned by the SAMS WebAPI.
 *
 * ASP.NET Core serialises with the web defaults, which camel-case property
 * names, so C# `Message` arrives as `message` and `HoldStatusName` as
 * `holdStatusName`.
 */

/** `Database.Extensions.HoldStatus`. A plain object, not a TS `enum`, because
 *  this project sets `erasableSyntaxOnly` -- `enum` emits runtime code. */
export const HoldStatus = {
  Pending: 1,
  Held: 2,
  Released: 3,
  Confirmed: 4,
} as const

export type HoldStatusId = (typeof HoldStatus)[keyof typeof HoldStatus]

/**
 * Raw payload of `GET /api/Auth/me`. Every field is a claim lookup, so every
 * field can be null even for an authenticated user.
 */
export interface MeResponse {
  userId: string | null
  userName: string | null
  email: string | null
  role: string | null
}

/** Normalised session used by the UI. */
export interface Session {
  userId: number
  userName: string
  email: string
  /** `Users.RoleName`, i.e. the enum *member* name: "Admin" or "Common". */
  role: string
  isAdmin: boolean
}

/** One row from `GET /api/Class/GetClassList`. The projection in ClassService
 *  already emits these exact camelCase names. */
export interface ClassSummary {
  id: number
  name: string
  totalSeats: number
  heldSeats: number
  confirmedSeats: number
  availableSeats: number
}

/** `Database.Models.Holds`. */
export interface Hold {
  holdId: number
  classId: number
  studentId: number
  holdStatusId: number
  holdStatusName: string
  /** ISO-8601 timestamp. */
  createdDate: string
  /** ISO-8601 timestamp, 5 minutes after `createdDate`. */
  expiresAt: string
}

export interface LoginRequest {
  email: string
  password: string
  rememberMe: boolean
}

export interface RegisterRequest {
  userName: string
  email: string
  password: string
}

export interface CreateClassRequest {
  className: string
  shiftId: number
  totalSeats: number
  holdNumber: number
  confirmedSeat: number
}

export interface CreateHoldRequest {
  /** 0 places a new hold; an existing id confirms that hold. */
  holdId: number
  classId: number
  studentId: number
}
