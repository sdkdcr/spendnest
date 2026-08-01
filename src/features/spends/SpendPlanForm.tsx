import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Category, Person } from '../../shared/domain/types'
import { SpendPlanIdentityFields } from './SpendPlanIdentityFields'
import { SpendPlanScheduleFields } from './SpendPlanScheduleFields'
import { StepEditor } from './StepEditor'
import type { SpendPlanDraft } from './spend-plan.repository'

interface SpendPlanFormProps {
  title: string
  submitLabel: string
  disabled?: boolean
  hideTitle?: boolean
  persons: Person[]
  categories: Category[]
  initialDraft?: SpendPlanDraft
  onSubmit: (draft: SpendPlanDraft) => Promise<void>
  onCancel?: () => void
}

const defaultStartMonth = new Date().toISOString().slice(0, 7)

const defaultDraft: SpendPlanDraft = {
  personId: undefined,
  categoryId: 0,
  name: '',
  frequency: 'Monthly',
  baseBudget: 0,
  startMonth: defaultStartMonth,
  endDate: undefined,
  dayOfDeduction: undefined,
  quantity: '',
  steps: [],
}

export function SpendPlanForm({
  title,
  submitLabel,
  disabled = false,
  hideTitle = false,
  persons,
  categories,
  initialDraft,
  onSubmit,
  onCancel,
}: SpendPlanFormProps) {
  const [draft, setDraft] = useState<SpendPlanDraft>(initialDraft ?? defaultDraft)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function patchDraft(patch: Partial<SpendPlanDraft>) {
    setDraft((current) => ({ ...current, ...patch }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedDraft: SpendPlanDraft = {
      personId: draft.personId,
      categoryId: draft.categoryId,
      name: draft.name.trim(),
      frequency: draft.frequency,
      baseBudget: draft.baseBudget,
      startMonth: draft.startMonth,
      endDate: draft.endDate || undefined,
      dayOfDeduction: draft.dayOfDeduction,
      quantity: draft.quantity.trim(),
      steps: draft.steps,
    }

    const hasInvalidDeductionDay =
      normalizedDraft.dayOfDeduction !== undefined &&
      (normalizedDraft.dayOfDeduction < 1 || normalizedDraft.dayOfDeduction > 31)

    if (
      !normalizedDraft.categoryId ||
      !normalizedDraft.name ||
      !normalizedDraft.quantity ||
      !normalizedDraft.startMonth ||
      normalizedDraft.baseBudget < 0 ||
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

  const fieldsDisabled = disabled || isSubmitting

  return (
    <form
      className={hideTitle ? 'spend-template-form spend-template-form-modal' : 'spend-template-form'}
      onSubmit={handleSubmit}
    >
      {!hideTitle ? <h3>{title}</h3> : null}

      <SpendPlanIdentityFields
        idPrefix={title}
        draft={draft}
        onChange={patchDraft}
        persons={persons}
        categories={categories}
        disabled={fieldsDisabled}
      />

      <SpendPlanScheduleFields
        idPrefix={title}
        draft={draft}
        onChange={patchDraft}
        disabled={fieldsDisabled}
      />

      <StepEditor
        steps={draft.steps}
        onChange={(steps) => {
          patchDraft({ steps })
        }}
        disabled={fieldsDisabled}
      />

      <div className="spend-template-actions">
        <button
          className="families-button families-button-primary"
          type="submit"
          disabled={fieldsDisabled}
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
