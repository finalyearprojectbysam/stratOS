import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)

export function fmtDate(d) {
  if (!d) return '—'
  return dayjs(d).format('MMM D, YYYY')
}
export function fmtTime(d) {
  if (!d) return ''
  return dayjs(d).format('h:mm A')
}
export function fmtRelative(d) {
  if (!d) return '—'
  return dayjs(d).fromNow()
}
export function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join('') || 'U'
}
export function fmtDuration(seconds) {
  if (!seconds && seconds !== 0) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}
