import type { MonthlySpendEntry } from '../../shared/domain/types'

export function computeEntryScores(entries: MonthlySpendEntry[]): Map<number, number> {
  const valid = entries.filter((e) => e.id !== undefined)
  if (valid.length === 0) return new Map()

  const costs = valid.map((e) => e.cost)
  const max = Math.max(...costs)
  const min = Math.min(...costs)
  const range = max - min

  return new Map(
    valid.map((e) => {
      const score = range === 0 ? 10 : ((e.cost - min) / range) * 9 + 1
      return [e.id!, Math.round(score * 10) / 10]
    }),
  )
}

export function scoreToColor(score: number): string {
  const t = (score - 1) / 9
  const r = Math.round(255 + (139 - 255) * t) // 255 → 139
  const g = Math.round(215 * (1 - t))          // 215 → 0
  return `rgb(${r}, ${g}, 0)`
}

export function scoreToTextColor(score: number): string {
  return score < 6 ? '#333333' : '#ffffff'
}
