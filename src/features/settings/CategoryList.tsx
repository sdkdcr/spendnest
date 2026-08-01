import { useState } from 'react'
import type { CategoryWithUsage } from './useCategoryManager'

interface CategoryListProps {
  categories: CategoryWithUsage[]
  onRename: (categoryId: number, name: string) => Promise<boolean>
  onDelete: (categoryId: number) => void
}

export function CategoryList({ categories, onRename, onDelete }: CategoryListProps) {
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)
  const [editingCategoryName, setEditingCategoryName] = useState('')

  async function handleSaveRename(categoryId: number) {
    const normalizedName = editingCategoryName.trim()
    if (!normalizedName) {
      return
    }

    const updated = await onRename(categoryId, normalizedName)
    if (updated) {
      setEditingCategoryId(null)
      setEditingCategoryName('')
    }
  }

  return (
    <ul className="settings-category-list">
      {categories.map((category) => {
        const categoryId = category.id
        if (categoryId === undefined) {
          return null
        }

        const isEditing = editingCategoryId === categoryId
        const isInUse = category.planCount > 0

        return (
          <li className="settings-category-item" key={categoryId}>
            <div className="settings-category-row">
              <span
                className="settings-category-swatch"
                style={{ backgroundColor: category.color }}
                aria-hidden="true"
              />
              <span className="settings-category-name">{category.name}</span>
              <span className="settings-category-usage">
                {category.planCount} plan{category.planCount === 1 ? '' : 's'}
              </span>

              <div className="family-actions">
                <button
                  className="families-button"
                  type="button"
                  onClick={() => {
                    setEditingCategoryId(categoryId)
                    setEditingCategoryName(category.name)
                  }}
                >
                  Rename
                </button>
                <button
                  className="families-button families-button-delete"
                  type="button"
                  disabled={isInUse}
                  title={isInUse ? 'Reassign or remove referencing spend plans first.' : undefined}
                  onClick={() => {
                    onDelete(categoryId)
                  }}
                >
                  Delete
                </button>
              </div>
            </div>

            {isEditing ? (
              <div className="family-edit">
                <input
                  className="families-input"
                  value={editingCategoryName}
                  onChange={(event) => {
                    setEditingCategoryName(event.currentTarget.value)
                  }}
                />
                <button
                  className="families-button families-button-primary"
                  type="button"
                  onClick={() => {
                    void handleSaveRename(categoryId)
                  }}
                >
                  Save
                </button>
                <button
                  className="families-button"
                  type="button"
                  onClick={() => {
                    setEditingCategoryId(null)
                    setEditingCategoryName('')
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
