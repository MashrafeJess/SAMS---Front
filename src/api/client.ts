/**
 * Thin fetch wrapper for the SAMS WebAPI.
 *
 * Three things every call needs and one thing the server does inconsistently:
 *
 *  1. `credentials: 'include'` -- auth is a cookie (`SAMS.Auth`), not a bearer
 *     token. `fetch` defaults to `same-origin`, which *happens* to work through
 *     the Vite proxy, but being explicit means this still works if you later
 *     move the API to its own origin and add CORS.
 *  2. The dev server proxies `/api`, so the base URL is always relative.
 *  3. Errors arrive in three different shapes (see `extractMessage`).
 *
 * The inconsistency: most SAMS endpoints wrap their payload as
 * `{ message, data }`, but `GET /api/Auth/me` returns the user object bare.
 * Hence two entry points: `http` (raw) and `envelope` (unwrapped).
 */

const BASE = '/api'

export class ApiError extends Error {
  /** HTTP status, or 0 when the request never reached the server. */
  status: number
  /** Parsed JSON body if there was one, otherwise the raw text. */
  body: unknown

  constructor(status: number, message: string, body: unknown = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export interface Envelope<T> {
  message: string
  data: T
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * ASP.NET model validation (`[ApiController]` + `[Required]`/`[EmailAddress]`
 * on LoginDto) returns ValidationProblemDetails:
 *   { title, status, errors: { Email: ["The Email field is not a valid..."] } }
 * Flatten that into one readable line.
 */
function flattenValidationErrors(body: unknown): string | null {
  if (!isRecord(body) || !isRecord(body.errors)) return null
  const lines: string[] = []
  for (const messages of Object.values(body.errors)) {
    if (Array.isArray(messages)) {
      for (const m of messages) if (typeof m === 'string') lines.push(m)
    }
  }
  return lines.length > 0 ? lines.join(' ') : null
}

/**
 * The SAMS services wrap failures as `throw new Exception("..." + ex)`, which
 * ASP.NET turns into an unhandled 500 -- an HTML developer page in Development,
 * an empty body in Production. Neither is useful on screen, so translate the
 * signatures you are actually likely to hit into something actionable.
 */
function diagnose(status: number, raw: string): string {
  if (/relation "Shift" does not exist|42P01/i.test(raw)) {
    return (
      'The API crashed because the "Shift" table does not exist. ' +
      'SamsDbContext exposes DbSet<Shifts> but InitialCreate never created it -- ' +
      'run: dotnet ef migrations add AddShifts && dotnet ef database update'
    )
  }
  if (/Hold has expired/i.test(raw)) {
    return (
      'The API rejected this hold as expired. Note HoldService compares ' +
      'DateTime.Now (local) against ExpiresAt (UTC), so in any timezone ahead ' +
      'of UTC every hold looks expired immediately.'
    )
  }
  if (status >= 500) {
    return `The API threw an unhandled exception (HTTP ${status}). Check the WebAPI console for the stack trace.`
  }
  return `Request failed with HTTP ${status}.`
}

function extractMessage(status: number, parsed: unknown, raw: string): string {
  // 1. The SAMS convention: { message: "..." }
  if (isRecord(parsed) && typeof parsed.message === 'string' && parsed.message) {
    return parsed.message
  }
  // 2. ASP.NET validation problem details.
  const validation = flattenValidationErrors(parsed)
  if (validation) return validation
  // 3. A ProblemDetails title, if the pipeline produced one.
  if (isRecord(parsed) && typeof parsed.title === 'string' && parsed.title) {
    return parsed.title
  }
  // 4. An HTML error page or an empty body.
  return diagnose(status, raw)
}

/** Issues the request and returns the parsed JSON body as-is. */
export async function http<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body !== undefined && init.body !== null) {
    headers.set('Content-Type', 'application/json')
  }

  let response: Response
  try {
    response = await fetch(`${BASE}${path}`, {
      ...init,
      headers,
      credentials: 'include',
    })
  } catch {
    throw new ApiError(
      0,
      'Could not reach the SAMS API. Start the WebAPI project and check that ' +
        'VITE_API_TARGET matches its launch profile.',
    )
  }

  const raw = await response.text()
  let parsed: unknown = null
  if (raw) {
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = null // HTML developer-exception page, most likely.
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, extractMessage(response.status, parsed, raw), parsed ?? raw)
  }

  return parsed as T
}

/** Issues the request and unwraps the `{ message, data }` envelope. */
export async function envelope<T>(path: string, init: RequestInit = {}): Promise<Envelope<T>> {
  const body = await http<Partial<Envelope<T>> | null>(path, init)
  return {
    message: body?.message ?? '',
    data: (body?.data ?? null) as T,
  }
}

/** Builds a query string, skipping null/undefined values. */
export function query(params: Record<string, string | number | boolean | null | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined) search.set(key, String(value))
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

/** Turns any thrown value into something safe to render. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Something went wrong.'
}
