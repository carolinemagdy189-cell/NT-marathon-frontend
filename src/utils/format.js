/**
 * Cairo-safe display formatting for backend values.
 *
 * The backend sends:
 *   - date-only strings ("2026-10-01") — treated as CALENDAR dates, never
 *     parsed with `new Date(str)` which would shift them a day in UTC.
 *   - ISO timestamps (savedAt, lastLoginAt, loginAt) — real instants,
 *     rendered in Africa/Cairo.
 *
 * All schedule/progress logic stays in the backend; this file only formats
 * values for display.
 */

const CAIRO_TZ = 'Africa/Cairo'

const AR_NUM = new Intl.NumberFormat('ar-EG')

/** "2026-10-04" -> "الأحد، 4 أكتوبر 2026" (calendar date, no UTC shift). */
export function formatCairoDateLabel(dateKey) {
  if (!dateKey) return ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return dateKey

  const [y, m, d] = dateKey.split('-').map(Number)
  const utc = new Date(Date.UTC(y, m - 1, d))

  return new Intl.DateTimeFormat('ar-EG', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(utc)
}

/** "2026-10-04" -> "4 أكتوبر" (day + month only, for compact rows). */
export function formatCairoShortDate(dateKey) {
  if (!dateKey) return ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return dateKey

  const [y, m, d] = dateKey.split('-').map(Number)
  const utc = new Date(Date.UTC(y, m - 1, d))

  return new Intl.DateTimeFormat('ar-EG', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'long',
  }).format(utc)
}

/** ISO timestamp -> "7:42 م" in Africa/Cairo. */
export function formatCairoTime(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('ar-EG', {
    timeZone: CAIRO_TZ,
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

/** ISO timestamp -> "26 سبتمبر، 7:42 م" in Africa/Cairo. */
export function formatCairoDateTime(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('ar-EG', {
    timeZone: CAIRO_TZ,
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

/** "Caroline Magdy" -> "CM" (max two initials, for the avatar circles). */
export function initialsOf(name) {
  return (
    (name || '')
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase()
  )
}

export { AR_NUM }
