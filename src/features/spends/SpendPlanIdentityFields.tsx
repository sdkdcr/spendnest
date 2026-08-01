import type { Person } from '../../shared/domain/types'
import type { SpendPlanDraft } from './spend-plan.repository'

interface SpendPlanIdentityFieldsProps {
  idPrefix: string
  draft: SpendPlanDraft
  onChange: (patch: Partial<SpendPlanDraft>) => void
  persons: Person[]
  knownTypes: string[]
  disabled: boolean
}

export function SpendPlanIdentityFields({
  idPrefix,
  draft,
  onChange,
  persons,
  knownTypes,
  disabled,
}: SpendPlanIdentityFieldsProps) {
  return (
    <>
      <label htmlFor={`${idPrefix}-person`}>Person Tag (Optional)</label>
      <select
        id={`${idPrefix}-person`}
        value={draft.personId ?? ''}
        onChange={(event) => {
          const value = event.currentTarget.value
          onChange({ personId: value ? Number(value) : undefined })
        }}
        disabled={disabled}
      >
        <option value="">No person tag</option>
        {persons.map((person) => {
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

      <label htmlFor={`${idPrefix}-type`}>Category</label>
      <input
        id={`${idPrefix}-type`}
        className="families-input"
        list={`${idPrefix}-type-list`}
        value={draft.type}
        onChange={(event) => {
          onChange({ type: event.currentTarget.value })
        }}
        placeholder="e.g. Utilities"
        disabled={disabled}
      />
      <datalist id={`${idPrefix}-type-list`}>
        {knownTypes.map((category) => (
          <option key={category} value={category} />
        ))}
      </datalist>

      <label htmlFor={`${idPrefix}-name`}>Name</label>
      <input
        id={`${idPrefix}-name`}
        className="families-input"
        value={draft.name}
        onChange={(event) => {
          onChange({ name: event.currentTarget.value })
        }}
        placeholder="e.g. Electricity Bill"
        disabled={disabled}
      />

      <label htmlFor={`${idPrefix}-base-budget`}>Base Budget</label>
      <input
        id={`${idPrefix}-base-budget`}
        className="families-input"
        type="number"
        min="0"
        step="0.01"
        value={draft.baseBudget}
        onChange={(event) => {
          onChange({ baseBudget: Number(event.currentTarget.value) })
        }}
        disabled={disabled}
      />

      <label htmlFor={`${idPrefix}-quantity`}>Quantity</label>
      <input
        id={`${idPrefix}-quantity`}
        className="families-input"
        value={draft.quantity}
        onChange={(event) => {
          onChange({ quantity: event.currentTarget.value })
        }}
        placeholder="e.g. 1 month / 50 L"
        disabled={disabled}
      />
    </>
  )
}
