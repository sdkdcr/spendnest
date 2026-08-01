import { SORT_OPTIONS, type PlanSortKey } from './plan-sort'

interface PlanSortBarProps {
  value: PlanSortKey
  onChange: (key: PlanSortKey) => void
}

export function PlanSortBar({ value, onChange }: PlanSortBarProps) {
  return (
    <div className="dashboard-sort-bar">
      <span className="dashboard-sort-label">Sort:</span>
      <div className="dashboard-sort-options" role="group" aria-label="Sort plans by">
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
