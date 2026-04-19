import type { MonthlySpendEntry } from '../../shared/domain/types'

export type EntrySortKey = 'cost-desc' | 'cost-asc' | 'category' | 'not-yet'

const STATUS_ORDER: Record<string, number> = { 'Not Yet': 0, 'Spent': 1, 'Skip': 2 }

const SORT_OPTIONS: { key: EntrySortKey; label: string }[] = [
  { key: 'cost-desc', label: 'Cost ↓' },
  { key: 'cost-asc', label: 'Cost ↑' },
  { key: 'category', label: 'Category' },
  { key: 'not-yet', label: 'Pending First' },
]

export function sortEntries(
  entries: MonthlySpendEntry[],
  key: EntrySortKey,
): MonthlySpendEntry[] {
  const sorted = [...entries]
  switch (key) {
    case 'cost-desc':
      return sorted.sort((a, b) => b.cost - a.cost)
    case 'cost-asc':
      return sorted.sort((a, b) => a.cost - b.cost)
    case 'category':
      return sorted.sort(
        (a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name),
      )
    case 'not-yet':
      return sorted.sort(
        (a, b) => (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3),
      )
  }
}

interface EntrySortBarProps {
  value: EntrySortKey
  onChange: (key: EntrySortKey) => void
}

export function EntrySortBar({ value, onChange }: EntrySortBarProps) {
  return (
    <div className="dashboard-sort-bar">
      <span className="dashboard-sort-label">Sort:</span>
      <div className="dashboard-sort-options" role="group" aria-label="Sort entries by">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            className={
              value === opt.key
                ? 'dashboard-status-btn dashboard-status-btn-active'
                : 'dashboard-status-btn'
            }
            onClick={() => onChange(opt.key)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
