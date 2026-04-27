import { useMemo, useState } from 'react'
import type { SpendTemplate } from '../../shared/domain/types'
import { useAppStore } from '../../shared/state/useAppStore'
import { Modal } from '../../shared/ui/Modal'
import { buildCategoryColorMap } from '../dashboard/category-colors'
import { DEFAULT_SPEND_CATEGORIES } from './spend-categories'
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
    emiEndMonth: template.emiEndMonth,
    startMonth: template.startMonth,
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [groupBy, setGroupBy] = useState<'none' | 'category' | 'frequency'>('none')

  const groupedTemplates = useMemo(() => {
    if (groupBy === 'none') {
      return [{ key: 'all', label: null, templates: spendTemplates }]
    }
    const groups = new Map<string, SpendTemplate[]>()
    for (const template of spendTemplates) {
      const key = groupBy === 'category' ? template.type : template.frequency
      const existing = groups.get(key)
      if (existing) existing.push(template)
      else groups.set(key, [template])
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, templates]) => ({ key, label: key, templates }))
  }, [spendTemplates, groupBy])

  const knownTypes = useMemo(() => {
    const custom = spendTemplates.map((t) => t.type).filter(Boolean)
    return Array.from(new Set([...DEFAULT_SPEND_CATEGORIES, ...custom]))
  }, [spendTemplates])

  const categoryColorByType = useMemo(
    () => buildCategoryColorMap(knownTypes),
    [knownTypes],
  )

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
    setIsCreateModalOpen(false)
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
          <div className="spend-template-toolbar">
            <button
              className="families-button families-button-primary"
              type="button"
              onClick={() => {
                setIsCreateModalOpen(true)
              }}
            >
              Add Spend Template
            </button>
            <div className="spend-group-by">
              <span className="spend-group-by-label">Group:</span>
              {(['none', 'category', 'frequency'] as const).map((option) => (
                <button
                  key={option}
                  className={`families-button${groupBy === option ? ' families-button-primary' : ''}`}
                  type="button"
                  onClick={() => { setGroupBy(option) }}
                >
                  {option === 'none' ? 'None' : option === 'category' ? 'Category' : 'Frequency'}
                </button>
              ))}
            </div>
          </div>

          {isCreateModalOpen ? (
            <Modal
              title="Create Spend Template"
              onClose={() => {
                setIsCreateModalOpen(false)
              }}
            >
              <SpendTemplateForm
                key="create-template-form"
                title="Create Spend Template"
                submitLabel="Add Template"
                hideTitle
                persons={familyPersons}
                knownTypes={knownTypes}
                onSubmit={handleCreateTemplate}
                onCancel={() => {
                  setIsCreateModalOpen(false)
                }}
              />
            </Modal>
          ) : null}

          {editingTemplate ? (
            <Modal
              title="Edit Spend Template"
              onClose={() => {
                setEditingTemplateId(null)
              }}
            >
              <SpendTemplateForm
                key={`edit-template-${editingTemplate.id ?? 'unknown'}`}
                title="Edit Spend Template"
                submitLabel="Save Changes"
                hideTitle
                persons={familyPersons}
                knownTypes={knownTypes}
                initialDraft={toDraft(editingTemplate)}
                onSubmit={handleUpdateTemplate}
                onCancel={() => {
                  setEditingTemplateId(null)
                }}
              />
            </Modal>
          ) : null}

          {errorMessage ? <p className="families-error">{errorMessage}</p> : null}

          {isLoading ? (
            <p className="families-help">Loading spend templates...</p>
          ) : spendTemplates.length === 0 ? (
            <p className="families-help">No spend templates added yet.</p>
          ) : (
            <div className="spend-groups">
              {groupedTemplates.map(({ key, label, templates }) => (
                <div key={key} className="spend-group">
                  {label !== null && <h3 className="spend-group-heading">{label}</h3>}
                  <SpendTemplateList
                    spendTemplates={templates}
                    personNamesById={personNamesById}
                    categoryColorByType={categoryColorByType}
                    onEdit={(template) => {
                      if (template.id !== undefined) setEditingTemplateId(template.id)
                    }}
                    onDelete={(templateId) => {
                      void handleDeleteTemplate(templateId)
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
