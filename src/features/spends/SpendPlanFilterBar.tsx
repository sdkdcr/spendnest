import type { Person } from '../../shared/domain/types'

export type SpendPlanGroupBy = 'none' | 'category' | 'frequency'

const GROUP_BY_OPTIONS: { value: SpendPlanGroupBy; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'category', label: 'Category' },
  { value: 'frequency', label: 'Frequency' },
]

interface SpendPlanFilterBarProps {
  familyPersons: Person[]
  selectedPersonId: number | null
  onSelectedPersonIdChange: (personId: number | null) => void
  groupBy: SpendPlanGroupBy
  onGroupByChange: (groupBy: SpendPlanGroupBy) => void
  onAddPlan: () => void
}

export function SpendPlanFilterBar({
  familyPersons,
  selectedPersonId,
  onSelectedPersonIdChange,
  groupBy,
  onGroupByChange,
  onAddPlan,
}: SpendPlanFilterBarProps) {
  return (
    <>
      <div className="spends-filter-row">
        <label htmlFor="spends-person-filter">View scope</label>
        <select
          id="spends-person-filter"
          className="spends-filter-select"
          value={selectedPersonId === null ? '' : String(selectedPersonId)}
          onChange={(event) => {
            const value = event.currentTarget.value
            onSelectedPersonIdChange(value ? Number(value) : null)
          }}
        >
          <option value="">Entire Family</option>
          {familyPersons.map((person) => {
            if (person.id === undefined) {
              return null
            }

            return (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            )
          })}
        </select>
      </div>

      <div className="spend-template-toolbar">
        <button
          className="families-button families-button-primary"
          type="button"
          onClick={onAddPlan}
        >
          Add Spend Plan
        </button>
        <div className="spend-group-by">
          <span className="spend-group-by-label">Group:</span>
          {GROUP_BY_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={`families-button${groupBy === option.value ? ' families-button-primary' : ''}`}
              type="button"
              onClick={() => {
                onGroupByChange(option.value)
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
