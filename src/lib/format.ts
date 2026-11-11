/**
 * `GetClassList` builds its display name server-side as
 * `c.ClassName + " - " + s.ShiftName` over a LEFT JOIN. When a class points at
 * a ShiftId with no matching row -- which is every class until the Shift table
 * is populated, since no endpoint creates shifts -- ShiftName is null and the
 * name arrives as "Data Structures - " with a dangling separator.
 *
 * Trimming it here keeps the UI honest without pretending the join succeeded.
 * Delete this once the projection handles the null shift itself.
 */
export function displayClassName(name: string): string {
  return name.replace(/\s*-\s*$/, '').trim() || name.trim()
}
