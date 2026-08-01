import { useState } from 'react'
import type { FormEvent } from 'react'
import { Modal } from '../../shared/ui/Modal'
import { CategoryList } from './CategoryList'
import { useCategoryManager } from './useCategoryManager'

interface CategoryPanelProps {
  familyId: number | null
  familyName: string | null
}

export function CategoryPanel({ familyId, familyName }: CategoryPanelProps) {
  const {
    categories,
    isLoading,
    errorMessage,
    createCategory,
    renameCategory,
    updateRetirementSettings,
    deleteCategory,
  } = useCategoryManager(familyId)

  const [newCategoryName, setNewCategoryName] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  async function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedName = newCategoryName.trim()
    if (!normalizedName) {
      return
    }

    const created = await createCategory(normalizedName)
    if (created) {
      setNewCategoryName('')
      setIsCreateModalOpen(false)
    }
  }

  async function handleDeleteCategory(categoryId: number) {
    const shouldDelete = window.confirm('Delete this category?')
    if (!shouldDelete) {
      return
    }

    await deleteCategory(categoryId)
  }

  return (
    <div className="settings-category-panel">
      <div>
        <h3>Categories</h3>
        <p className="field-help">
          {familyName
            ? `Manage spend categories for ${familyName}.`
            : 'Select a family to manage categories.'}
        </p>
      </div>

      <div className="settings-category-toolbar">
        <button
          className="families-button families-button-primary"
          type="button"
          disabled={familyId === null}
          onClick={() => {
            setIsCreateModalOpen(true)
          }}
        >
          Add Category
        </button>
      </div>

      {isCreateModalOpen ? (
        <Modal
          title="Add Category"
          onClose={() => {
            setIsCreateModalOpen(false)
          }}
        >
          <form className="settings-category-create-form" onSubmit={handleCreateCategory}>
            <input
              className="families-input"
              value={newCategoryName}
              onChange={(event) => {
                setNewCategoryName(event.currentTarget.value)
              }}
              placeholder="e.g. Utilities"
            />
            <div className="families-create-actions">
              <button className="families-button families-button-primary" type="submit">
                Add Category
              </button>
              <button
                className="families-button"
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false)
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {errorMessage ? <p className="families-error">{errorMessage}</p> : null}

      {familyId === null ? (
        <p className="field-help">No active family selected.</p>
      ) : isLoading ? (
        <p className="field-help">Loading categories...</p>
      ) : categories.length === 0 ? (
        <p className="field-help">No categories added yet.</p>
      ) : (
        <CategoryList
          categories={categories}
          onRename={renameCategory}
          onUpdateRetirementSettings={updateRetirementSettings}
          onDelete={(categoryId) => {
            void handleDeleteCategory(categoryId)
          }}
        />
      )}
    </div>
  )
}
