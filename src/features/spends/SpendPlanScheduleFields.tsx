import type { SpendFrequency } from '../../shared/domain/types'
import type { SpendPlanDraft } from './spend-plan.repository'

interface SpendPlanScheduleFieldsProps {
  idPrefix: string
  draft: SpendPlanDraft
  onChange: (patch: Partial<SpendPlanDraft>) => void
  disabled: boolean
}

const frequencyOptions: SpendFrequency[] = [
  'Monthly',
  'Quarterly',
  'Annually',
  'AdHoc',
]

export function SpendPlanScheduleFields({
  idPrefix,
  draft,
  onChange,
  disabled,
}: SpendPlanScheduleFieldsProps) {
  return (
    <>
      <label htmlFor={`${idPrefix}-frequency`}>Frequency</label>
      <select
        id={`${idPrefix}-frequency`}
        value={draft.frequency}
        onChange={(event) => {
          onChange({ frequency: event.currentTarget.value as SpendFrequency })
        }}
        disabled={disabled}
      >
        {frequencyOptions.map((frequencyOption) => (
          <option key={frequencyOption} value={frequencyOption}>
            {frequencyOption}
          </option>
        ))}
      </select>

      <label htmlFor={`${idPrefix}-start-month`}>Start Month (cycle anchor)</label>
      <input
        id={`${idPrefix}-start-month`}
        className="families-input"
        type="month"
        value={draft.startMonth}
        onChange={(event) => {
          onChange({ startMonth: event.currentTarget.value })
        }}
        disabled={disabled}
      />

      <label htmlFor={`${idPrefix}-end-date`}>End Date (Optional)</label>
      <input
        id={`${idPrefix}-end-date`}
        className="families-input"
        type="month"
        value={draft.endDate ?? ''}
        onChange={(event) => {
          onChange({ endDate: event.currentTarget.value || undefined })
        }}
        disabled={disabled}
      />

      <label htmlFor={`${idPrefix}-day-of-deduction`}>Day of Deduction (1-31, Optional)</label>
      <input
        id={`${idPrefix}-day-of-deduction`}
        className="families-input"
        type="number"
        min="1"
        max="31"
        step="1"
        value={draft.dayOfDeduction ?? ''}
        onChange={(event) => {
          const value = event.currentTarget.value
          onChange({ dayOfDeduction: value === '' ? undefined : Number(value) })
        }}
        disabled={disabled}
      />
    </>
  )
}
