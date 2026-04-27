import type { SpendTemplate } from '../../shared/domain/types'

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

export function isTemplateEligibleForMonth(
  template: SpendTemplate,
  monthKey: string,
): boolean {
  const targetMonth = parseYearMonth(monthKey)
  const createdAtMonth = parseYearMonth(template.createdAt.slice(0, 7))

  if (!targetMonth || !createdAtMonth) {
    return false
  }

  // Never generate entries before the template was created
  if (monthDiff(createdAtMonth, targetMonth) < 0) {
    return false
  }

  if (template.emiEndMonth !== undefined && monthKey > template.emiEndMonth) {
    return false
  }

  switch (template.frequency) {
    case 'Monthly':
    case 'AdHoc':
      return true
    case 'Quarterly':
    case 'Annually': {
      // Use startMonth as cycle anchor if set, otherwise fall back to createdAt
      const anchorRaw = template.startMonth ?? template.createdAt.slice(0, 7)
      const anchorMonth = parseYearMonth(anchorRaw)
      if (!anchorMonth) {
        return false
      }
      const elapsed = monthDiff(anchorMonth, targetMonth)
      return template.frequency === 'Quarterly' ? elapsed % 3 === 0 : elapsed % 12 === 0
    }
    default:
      return false
  }
}
