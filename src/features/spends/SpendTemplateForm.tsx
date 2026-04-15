import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Person, SpendFrequency } from '../../shared/domain/types'
import type { SpendTemplateDraft } from './spend-template.repository'

interface SpendTemplateFormProps {
  title: string
  submitLabel: string
  disabled?: boolean
  hideTitle?: boolean
  persons: Person[]
  initialDraft?: SpendTemplateDraft
  onSubmit: (draft: SpendTemplateDraft) => Promise<void>
  onCancel?: () => void
}

const frequencyOptions: SpendFrequency[] = [
  'Monthly',
  'Quarterly',
  'Annually',
  'AdHoc',
]

const defaultDraft: SpendTemplateDraft = {
  personId: undefined,
  type: '',
  name: '',
  frequency: 'Monthly',
  cost: 0,
  quantity: '',
  emiAmount: undefined,
  deductionDayOfMonth: undefined,
}

export function SpendTemplateForm({
  title,
  submitLabel,
  disabled = false,
  hideTitle = false,
  persons,
  initialDraft,
  onSubmit,
  onCancel,
}: SpendTemplateFormProps) {
  const [draft, setDraft] = useState<SpendTemplateDraft>(
    initialDraft ?? defaultDraft,
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedDraft: SpendTemplateDraft = {
      personId: draft.personId,
      type: draft.type.trim(),
      name: draft.name.trim(),
      frequency: draft.frequency,
      cost: draft.cost,
      quantity: draft.quantity.trim(),
      emiAmount: draft.emiAmount,
      deductionDayOfMonth: draft.deductionDayOfMonth,
    }

    const hasInvalidEmiAmount =
      normalizedDraft.emiAmount !== undefined && normalizedDraft.emiAmount < 0

    const hasInvalidDeductionDay =
      normalizedDraft.deductionDayOfMonth !== undefined &&
      (normalizedDraft.deductionDayOfMonth < 1 ||
        normalizedDraft.deductionDayOfMonth > 31)

    if (
      !normalizedDraft.type ||
      !normalizedDraft.name ||
      !normalizedDraft.quantity ||
      normalizedDraft.cost < 0 ||
      hasInvalidEmiAmount ||
      hasInvalidDeductionDay
    ) {
      return
    }

    setIsSubmitting(true)
    await onSubmit(normalizedDraft)
    setIsSubmitting(false)

    if (!initialDraft) {
      setDraft(defaultDraft)
    }
  }

  return (
    <form
      className={hideTitle ? 'spend-template-form spend-template-form-modal' : 'spend-template-form'}
      onSubmit={handleSubmit}
    >
      {!hideTitle ? <h3>{title}</h3> : null}

      <label htmlFor={`${title}-person`}>Person Tag (Optional)</label>
      <select
        id={`${title}-person`}
        value={draft.personId ?? ''}
        onChange={(event) => {
          const value = event.currentTarget.value

          setDraft((currentDraft) => ({
            ...currentDraft,
            personId: value ? Number(value) : undefined,
          }))
        }}
        disabled={disabled || isSubmitting}
      >
        <option value="">No person tag</option>
        {persons.map((person) => {
          const personId = person.id
          if (personId === undefined) {
            return null
          }

          return (
            <option key={personId} value={personId}>
              {person.name}
            </option>
          )
        })}
      </select>

      <label htmlFor={`${title}-type`}>Type</label>
      <input
        id={`${title}-type`}
        className="families-input"
        value={draft.type}
        onChange={(event) => {
          const value = event.currentTarget.value

          setDraft((currentDraft) => ({
            ...currentDraft,
            type: value,
          }))
        }}
        placeholder="e.g. Utility"
        disabled={disabled || isSubmitting}
      />

      <label htmlFor={`${title}-name`}>Name</label>
      <input
        id={`${title}-name`}
        className="families-input"
        value={draft.name}
        onChange={(event) => {
          const value = event.currentTarget.value

          setDraft((currentDraft) => ({
            ...currentDraft,
            name: value,
          }))
        }}
        placeholder="e.g. Electricity Bill"
        disabled={disabled || isSubmitting}
      />

      <label htmlFor={`${title}-frequency`}>Frequency</label>
      <select
        id={`${title}-frequency`}
        value={draft.frequency}
        onChange={(event) => {
          const value = event.currentTarget.value as SpendFrequency

          setDraft((currentDraft) => ({
            ...currentDraft,
            frequency: value,
          }))
        }}
        disabled={disabled || isSubmitting}
      >
        {frequencyOptions.map((frequencyOption) => (
          <option key={frequencyOption} value={frequencyOption}>
            {frequencyOption}
          </option>
        ))}
      </select>

      <label htmlFor={`${title}-cost`}>Cost</label>
      <input
        id={`${title}-cost`}
        className="families-input"
        type="number"
        min="0"
        step="0.01"
        value={draft.cost}
        onChange={(event) => {
          const value = Number(event.currentTarget.value)

          setDraft((currentDraft) => ({
            ...currentDraft,
            cost: value,
          }))
        }}
        disabled={disabled || isSubmitting}
      />

      <label htmlFor={`${title}-quantity`}>Quantity</label>
      <input
        id={`${title}-quantity`}
        className="families-input"
        value={draft.quantity}
        onChange={(event) => {
          const value = event.currentTarget.value

          setDraft((currentDraft) => ({
            ...currentDraft,
            quantity: value,
          }))
        }}
        placeholder="e.g. 1 month / 50 L"
        disabled={disabled || isSubmitting}
      />

      <label htmlFor={`${title}-emi-amount`}>EMI Amount (Optional)</label>
      <input
        id={`${title}-emi-amount`}
        className="families-input"
        type="number"
        min="0"
        step="0.01"
        value={draft.emiAmount ?? ''}
        onChange={(event) => {
          const value = event.currentTarget.value

          setDraft((currentDraft) => ({
            ...currentDraft,
            emiAmount: value === '' ? undefined : Number(value),
          }))
        }}
        disabled={disabled || isSubmitting}
      />

      <label htmlFor={`${title}-emi-day`}>Deduction Day (1-31, Optional)</label>
      <input
        id={`${title}-emi-day`}
        className="families-input"
        type="number"
        min="1"
        max="31"
        step="1"
        value={draft.deductionDayOfMonth ?? ''}
        onChange={(event) => {
          const value = event.currentTarget.value

          setDraft((currentDraft) => ({
            ...currentDraft,
            deductionDayOfMonth: value === '' ? undefined : Number(value),
          }))
        }}
        disabled={disabled || isSubmitting}
      />

      <div className="spend-template-actions">
        <button
          className="families-button families-button-primary"
          type="submit"
          disabled={disabled || isSubmitting}
        >
          {submitLabel}
        </button>

        {onCancel ? (
          <button
            className="families-button"
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  )
}
