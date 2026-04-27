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

function getTemplateStartMonth(template: SpendTemplate): YearMonth | null {
  return parseYearMonth(template.createdAt.slice(0, 7))
}

export function isTemplateEligibleForMonth(
  template: SpendTemplate,
  monthKey: string,
): boolean {
  const targetMonth = parseYearMonth(monthKey)
  const startMonth = getTemplateStartMonth(template)

  if (!targetMonth || !startMonth) {
    return false
  }

  const elapsedMonths = monthDiff(startMonth, targetMonth)
  if (elapsedMonths < 0) {
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
      return elapsedMonths % 3 === 0
    case 'Annually':
      return elapsedMonths % 12 === 0
    default:
      return false
  }
}
