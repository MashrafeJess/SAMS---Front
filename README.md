# SAMS front end

React + TypeScript + Vite client for the SAMS (Seat Allocation Management System)
WebAPI.

## What it does

| Route            | Who          | Purpose                                                        |
| ---------------- | ------------ | -------------------------------------------------------------- |
| `/login`         | anonymous    | Cookie sign-in, with a "keep me signed in" option               |
| `/register`      | anonymous    | Creates a student account, then signs in automatically          |
| `/classes`        | signed in    | Seat availability per class; place, confirm and release holds  |
| `/my-holds`       | signed in    | Every hold you own, with a live expiry countdown               |
| `/admin/classes`  | `Admin` only | Create classes and review seat usage across all of them        |
| `/admin/students` | `Admin` only | Enrol a student directly, without self-registration            |

`/register` and `/admin/students` both post to `POST /api/Auth/AddStudent`, but
they are deliberately **not** the same flow. `/register` signs the new account
in afterwards, because the person filling it in is the new student.
`/admin/students` does not — signing in there would swap the admin's
`SAMS.Auth` cookie for the student's and silently demote whoever is at the
screen. Note also that `AddStudent` always creates a `Common` (student) user, so
granting Admin remains a database change.

## Running it

The API and the client must both be up.

**1. Start the WebAPI using the `https` launch profile.**

```bash
cd ../../SAMS           # wherever your SAMS solution lives
dotnet run --project WebAPI --launch-profile https
```

The profile matters. `Program.cs` calls `app.UseHttpsRedirection()`, so under the
`http` profile every `/api` request answers `307` and points at
`https://localhost:7153` — a port that profile never binds. Use `https`, which
binds both `7153` and `5080`.

**2. Start the client.**

```bash
npm install
npm run dev            # http://localhost:5173
```

To point at a different API, copy `.env.example` to `.env` and set
`VITE_API_TARGET`.

## Why there is a dev proxy and no CORS

`vite.config.ts` proxies `/api` to the WebAPI. That is not a convenience — it is
what makes the login cookie work at all.

The API issues its session as a cookie:

```
Set-Cookie: SAMS.Auth=...; path=/; secure; samesite=lax; httponly
```

`SameSite=Lax` means the browser only attaches that cookie to requests the
browser considers *same-site*. A "site" is scheme + registrable domain, so
`http://localhost:5173` and `https://localhost:7153` are **different sites** —
the differing scheme is enough, ports aside. Calling the API directly from the
page would therefore drop the cookie from every `fetch`, and you would be
signed out on every request no matter what CORS allowed.

Through the proxy the browser only ever talks to `http://localhost:5173`, so the
cookie is first-party, `Lax` is satisfied, and no CORS preflight happens. The
API needs no `AddCors` call.

Two details that make this work in development:

- `secure: false` on the proxy tells **Node** to accept the self-signed ASP.NET
  dev certificate. It does not weaken anything in the browser.
- The cookie is marked `Secure`, yet arrives over plain `http`. Browsers treat
  `localhost` as a trustworthy origin, so they accept it. (Older Safari does
  not; Chrome, Edge and Firefox do.)

For production, serve the built client from the same origin as the API, or add
CORS with `AllowCredentials` plus `SameSite=None; Secure`.

## Layout

```
src/
  api/
    types.ts        Request/response shapes, mirroring the C# DTOs
    client.ts       fetch wrapper: cookies, envelope unwrapping, error shaping
    endpoints.ts    One function per SAMS endpoint
  auth/
    context.ts      AuthContext + useAuth/useSession
    AuthProvider.tsx  Reads /Auth/me, owns login and logout
    guards.tsx      RequireAuth, RequireAdmin, RedirectIfAuthenticated
  components/       AppShell, ClassCard, SeatMeter, Countdown, form primitives
  lib/              Date parsing, hold-status helpers, useResource, useNow
  pages/            One component per route
```

### Three API quirks the client absorbs

1. **Two response shapes.** Most endpoints return `{ message, data }`, but
   `GET /Auth/me` returns the user object bare. Hence `envelope()` and `http()`
   in `client.ts`.
2. **`CreateHold` is overloaded on `holdId`.** `0` places a new hold; a real id
   confirms the existing one. `endpoints.ts` splits this into `holds.place()`
   and `holds.confirm()` so the intent is visible at the call site.
3. **Failures arrive in three formats** — the SAMS `{ message }`, ASP.NET
   `ValidationProblemDetails`, or an HTML developer-exception page for an
   unhandled 500. `extractMessage()` handles all three and translates the two
   server exceptions you are most likely to hit into something actionable.

## The hold lifecycle

```
          place                 confirm
  (none) ------> Held ------------------> Confirmed
                  |  \
         delete   |   \  ExpiresAt passes (sweeper, or the confirm attempt)
                  v    `-------> Released --delete--> (gone)
               (gone)
```

- A hold lasts five minutes (`HoldService.HoldWindow`).
- **Releasing deletes the row** and returns the seat immediately.
- **Lapsing marks it `Released`** instead, so the student can still see what
  happened; "Remove" on `/my-holds` deletes it for good.
- `HoldExpirySweeper` (a `BackgroundService`, 30s interval) returns lapsed
  seats to the pool. It is housekeeping, not enforcement — the confirm path
  re-checks expiry itself, so nothing is double-issued if the sweeper stops.

## Resolved server-side defects

All four were reproduced against a running instance before being fixed, and
re-verified after.

| Symptom in the UI                      | Cause                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------ |
| "Create class" always errored          | `CreateClass` called `AddAsync` then `Update` on the same new entity      |
| Class list failed to load              | No migration had ever created the `Shift` table                           |
| "Confirm seat" reported an expired hold| `DateTime.Now` (local) compared against `ExpiresAt` (UTC)                 |
| "Release" appeared to work but did not | `DeleteHold` called `Remove` without `SaveChangesAsync`                   |

## Still open on the API

- **No `[Authorize]`** on `ClassController` or `HoldController`, and
  `me/holds` takes `StudentId` from the query string — change the number and
  you read someone else's holds.
- **No concurrency control.** `HoldNumber` is read-modify-write with no
  transaction or concurrency token, so two students racing for the last seat
  can both win.
- **Nothing stops one student holding many seats** in the same class.
- **No endpoint lists shifts or users**, which is why the admin form asks you
  to type a shift id, and why `/admin/students` can only show what it created.
- **Shift rows must be inserted by hand**; until then every class name comes
  back as `"Name - "` and the client trims the dangling separator.
