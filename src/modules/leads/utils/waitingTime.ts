export function formatWaitingTime(createdAt: string | Date, now = Date.now()) {
  const created = createdAt instanceof Date ? createdAt.getTime() : new Date(createdAt).getTime()
  if (Number.isNaN(created)) return '—'
  const diffMs = Math.max(0, now - created)
  const minutes = Math.floor(diffMs / 60000)
  if (minutes <= 1) return '1 Minute'
  if (minutes < 60) return `${minutes} Minutes`
  const hours = Math.floor(minutes / 60)
  if (hours === 1) return '1 Hour'
  if (hours < 24) return `${hours} Hours`
  const days = Math.floor(hours / 24)
  return days === 1 ? '1 Day' : `${days} Days`
}
