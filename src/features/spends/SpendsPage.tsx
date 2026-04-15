import { useMemo, useState } from 'react'
import type { SpendTemplate } from '../../shared/domain/types'
import { useAppStore } from '../../shared/state/useAppStore'
import { SpendTemplateForm } from './SpendTemplateForm'
import { SpendTemplateList } from './SpendTemplateList'
import type { SpendTemplateDraft } from './spend-template.repository'
import { useFamilyPersons } from './useFamilyPersons'
import { useSpendTemplates } from './useSpendTemplates'
import './spends.css'

function toDraft(template: SpendTemplate): SpendTemplateDraft {
  return {
    personId: template.personId,
    type: template.type,
    name: template.name,
    frequency: template.frequency,
    cost: template.cost,
    quantity: template.quantity,
    emiAmount: template.emiAmount,
    deductionDayOfMonth: template.deductionDayOfMonth,
  }
}

export function SpendsPage() {
  const selectedFamilyId = useAppStore((state) => state.selectedFamilyId)
  const familyPersons = useFamilyPersons(selectedFamilyId)
  const {
    spendTemplates,
    isLoading,
    errorMessage,
    createSpendTemplate,
    updateSpendTemplate,
    deleteSpendTemplate,
  } = useSpendTemplates(selectedFamilyId)

  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null)

  const personNamesById = useMemo(() => {
    return familyPersons.reduce<Record<number, string>>((acc, person) => {
      if (person.id !== undefined) {
        acc[person.id] = person.name
      }

      return acc
    }, {})
  }, [familyPersons])

  const editingTemplate = useMemo(() => {
    if (editingTemplateId === null) {
      return null
    }

    return (
      spendTemplates.find((template) => template.id === editingTemplateId) ?? null
    )
  }, [editingTemplateId, spendTemplates])

  async function handleCreateTemplate(draft: SpendTemplateDraft) {
    await createSpendTemplate(draft)
  }

  async function handleUpdateTemplate(draft: SpendTemplateDraft) {
    if (editingTemplateId === null) {
      return
    }

    const updated = await updateSpendTemplate(editingTemplateId, draft)
    if (updated) {
      setEditingTemplateId(null)
    }
  }

  async function handleDeleteTemplate(templateId: number) {
    const shouldDelete = window.confirm(
      'Delete this spend template and related monthly entries?',
    )

    if (!shouldDelete) {
      return
    }

    const deleted = await deleteSpendTemplate(templateId)
    if (deleted && editingTemplateId === templateId) {
      setEditingTemplateId(null)
    }
  }

  return (
    <section className="spends-layout">
      <div>
        <h2>Spends</h2>
        <p className="families-help">
          Manage spend templates for the active family.
        </p>
      </div>

      {selectedFamilyId === null ? (
        <p className="families-help">
          Select an active family in the Families tab to create spend templates.
        </p>
      ) : (
        <>
          <SpendTemplateForm
            key="create-template-form"
            title="Create Spend Template"
            submitLabel="Add Template"
            persons={familyPersons}
            onSubmit={handleCreateTemplate}
          />

          {editingTemplate ? (
            <SpendTemplateForm
              key={`edit-template-${editingTemplate.id ?? 'unknown'}`}
              title="Edit Spend Template"
              submitLabel="Save Changes"
              persons={familyPersons}
              initialDraft={toDraft(editingTemplate)}
              onSubmit={handleUpdateTemplate}
              onCancel={() => {
                setEditingTemplateId(null)
              }}
            />
          ) : null}

          {errorMessage ? <p className="families-error">{errorMessage}</p> : null}

          {isLoading ? (
            <p className="families-help">Loading spend templates...</p>
          ) : spendTemplates.length === 0 ? (
            <p className="families-help">No spend templates added yet.</p>
          ) : (
            <SpendTemplateList
              spendTemplates={spendTemplates}
              personNamesById={personNamesById}
              onEdit={(template) => {
                if (template.id !== undefined) {
                  setEditingTemplateId(template.id)
                }
              }}
              onDelete={(templateId) => {
                void handleDeleteTemplate(templateId)
              }}
            />
          )}
        </>
      )}
    </section>
  )
}
