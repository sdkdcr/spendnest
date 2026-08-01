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
