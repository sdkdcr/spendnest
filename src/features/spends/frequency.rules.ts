import type { SpendPlan } from '../../shared/domain/types'

interface YearMonth {
  year: number
  month: number
}

function parseYearMonth(value: string): YearMonth | null {
  const [yearToken, monthToken] = value.split('-')
  const year = Number(yearToken)
  const month = Number(monthToken)

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return null
  }

  return { year, month }
}

function monthDiff(from: YearMonth, to: YearMonth): number {
  return (to.year - from.year) * 12 + (to.month - from.month)
}

export function isPlanEligibleForMonth(
  plan: SpendPlan,
  monthKey: string,
): boolean {
  const targetMonth = parseYearMonth(monthKey)
  const anchorMonth = parseYearMonth(plan.startMonth)

  if (!targetMonth || !anchorMonth) {
    return false
  }

  if (monthDiff(anchorMonth, targetMonth) < 0) {
    return false
  }

  if (plan.endDate !== undefined && monthKey > plan.endDate) {
    return false
  }

  switch (plan.frequency) {
    case 'Monthly':
    case 'AdHoc':
      return true
    case 'Quarterly':
    case 'Annually': {
      const elapsed = monthDiff(anchorMonth, targetMonth)
      return plan.frequency === 'Quarterly' ? elapsed % 3 === 0 : elapsed % 12 === 0
    }
    default:
      return false
  }
}
