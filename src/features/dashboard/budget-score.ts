const MIN_SCORE = 1
const MAX_SCORE = 10
const SCORE_SPAN = MAX_SCORE - MIN_SCORE

export interface ScoredPlan {
  planId: number
  amount: number
}

export function computeBudgetScores(plans: ScoredPlan[]): Map<number, number> {
  if (plans.length === 0) {
    return new Map()
  }

  const amounts = plans.map((plan) => plan.amount)
  const max = Math.max(...amounts)
  const min = Math.min(...amounts)
  const range = max - min

  return new Map(
    plans.map((plan) => {
      const score =
        range === 0 ? MAX_SCORE : ((plan.amount - min) / range) * SCORE_SPAN + MIN_SCORE
      return [plan.planId, Math.round(score * 10) / 10]
    }),
  )
}

export function scoreToColor(score: number): string {
  const t = (score - MIN_SCORE) / SCORE_SPAN
  const r = Math.round(255 + (139 - 255) * t) // 255 -> 139
  const g = Math.round(215 * (1 - t)) // 215 -> 0
  return `rgb(${r}, ${g}, 0)`
}

export function scoreToTextColor(score: number): string {
  const MID_SCORE = 6
  return score < MID_SCORE ? '#333333' : '#ffffff'
}
