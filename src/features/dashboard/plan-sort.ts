export type PlanSortKey = 'cost-desc' | 'cost-asc' | 'category'

export interface SortablePlan {
  amount: number
  type: string
  name: string
}

export const SORT_OPTIONS: { key: PlanSortKey; label: string }[] = [
  { key: 'cost-desc', label: 'Cost ↓' },
  { key: 'cost-asc', label: 'Cost ↑' },
  { key: 'category', label: 'Category' },
]

export function sortPlansByKey<T extends SortablePlan>(plans: T[], key: PlanSortKey): T[] {
  const sorted = [...plans]
  switch (key) {
    case 'cost-desc':
      return sorted.sort((a, b) => b.amount - a.amount)
    case 'cost-asc':
      return sorted.sort((a, b) => a.amount - b.amount)
    case 'category':
      return sorted.sort(
        (a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name),
      )
  }
}
