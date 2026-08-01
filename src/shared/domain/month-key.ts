export function shiftMonthKey(monthKey: string, offset: number): string {
  const [yearToken, monthToken] = monthKey.split('-')
  const year = Number(yearToken)
  const month = Number(monthToken)

  const zeroBasedTotal = (year * 12 + (month - 1)) + offset
  const nextYear = Math.floor(zeroBasedTotal / 12)
  const nextMonth = (zeroBasedTotal % 12) + 1

  return `${nextYear}-${String(nextMonth).padStart(2, '0')}`
}

export function buildMonthRange(centerMonthKey: string, before: number, after: number): string[] {
  const range: string[] = []
  for (let offset = -before; offset <= after; offset += 1) {
    range.push(shiftMonthKey(centerMonthKey, offset))
  }
  return range
}

export function getCurrentMonthKey(): string {
  return new Date().toISOString().slice(0, 7)
}

export function formatMonthKeyShort(monthKey: string): string {
  const [yearToken, monthToken] = monthKey.split('-')
  const year = Number(yearToken)
  const month = Number(monthToken)

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return monthKey
  }

  const monthDate = new Date(year, month - 1, 1)
  const monthLabel = monthDate.toLocaleString('en-US', { month: 'short' })
  const shortYear = String(year).slice(-2)

  return `${monthLabel}'${shortYear}`
}
