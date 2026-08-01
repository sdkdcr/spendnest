import { useState } from 'react'
import type { StepChange } from '../../shared/domain/types'

interface StepEditorProps {
  steps: StepChange[]
  onChange: (steps: StepChange[]) => void
  disabled?: boolean
}

const defaultDraftStep = { effectiveDate: '', amount: '', oneOff: false }

export function StepEditor({ steps, onChange, disabled = false }: StepEditorProps) {
  const [draftStep, setDraftStep] = useState(defaultDraftStep)

  function addStep() {
    const amount = Number(draftStep.amount)
    if (!draftStep.effectiveDate || !Number.isFinite(amount) || amount < 0) {
      return
    }

    const nextStep: StepChange = {
      effectiveDate: draftStep.effectiveDate,
      amount,
      oneOff: draftStep.oneOff || undefined,
    }

    onChange([...steps, nextStep].sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate)))
    setDraftStep(defaultDraftStep)
  }

  function removeStep(index: number) {
    onChange(steps.filter((_, stepIndex) => stepIndex !== index))
  }

  return (
    <div className="step-editor">
      <p className="step-editor-label">Step-Up / Step-Down Changes</p>

      {steps.length > 0 ? (
        <ul className="step-editor-list">
          {steps.map((step, index) => (
            <li className="step-editor-item" key={`${step.effectiveDate}-${index}`}>
              <span>{step.effectiveDate}</span>
              <span>{step.amount}</span>
              <span>{step.oneOff ? 'One-off' : 'Permanent'}</span>
              <button
                type="button"
                className="families-button spend-template-delete"
                onClick={() => {
                  removeStep(index)
                }}
                disabled={disabled}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="families-help">No steps added yet.</p>
      )}

      <div className="step-editor-add-row">
        <input
          className="families-input"
          type="month"
          value={draftStep.effectiveDate}
          onChange={(event) => {
            setDraftStep((current) => ({ ...current, effectiveDate: event.currentTarget.value }))
          }}
          disabled={disabled}
        />
        <input
          className="families-input"
          type="number"
          min="0"
          step="0.01"
          placeholder="Amount"
          value={draftStep.amount}
          onChange={(event) => {
            setDraftStep((current) => ({ ...current, amount: event.currentTarget.value }))
          }}
          disabled={disabled}
        />
        <label className="step-editor-oneoff-label">
          <input
            type="checkbox"
            checked={draftStep.oneOff}
            onChange={(event) => {
              setDraftStep((current) => ({ ...current, oneOff: event.currentTarget.checked }))
            }}
            disabled={disabled}
          />
          One-off
        </label>
        <button
          type="button"
          className="families-button"
          onClick={addStep}
          disabled={disabled}
        >
          Add Step
        </button>
      </div>
    </div>
  )
}
