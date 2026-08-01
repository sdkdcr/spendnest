import { useCallback, useEffect, useState } from 'react'
import type { Category } from '../../shared/domain/types'
import {
  countPlansUsingCategory,
  createCategory,
  deleteCategory,
  listCategoriesByFamily,
  renameCategory,
  updateRetirementSettings,
  type RetirementSettings,
} from './category.repository'

export interface CategoryWithUsage extends Category {
  planCount: number
}

async function attachUsageCounts(categories: Category[]): Promise<CategoryWithUsage[]> {
  return Promise.all(
    categories.map(async (category) => ({
      ...category,
      planCount: category.id === undefined ? 0 : await countPlansUsingCategory(category.id),
    })),
  )
}

export function useCategoryManager(familyId: number | null) {
  const [categories, setCategories] = useState<CategoryWithUsage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const refreshCategories = useCallback(async () => {
    if (familyId === null) {
      setCategories([])
      return
    }

    setErrorMessage(null)

    try {
      const nextCategories = await listCategoriesByFamily(familyId)
      setCategories(await attachUsageCounts(nextCategories))
    } catch {
      setErrorMessage('Unable to load categories right now.')
    }
  }, [familyId])

  useEffect(() => {
    async function initCategories() {
      if (familyId === null) {
        setCategories([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      await refreshCategories()
      setIsLoading(false)
    }

    void initCategories()
  }, [familyId, refreshCategories])

  async function handleCreateCategory(name: string): Promise<Category | null> {
    if (familyId === null) {
      return null
    }

    setErrorMessage(null)

    try {
      const created = await createCategory(familyId, name)
      await refreshCategories()
      return created
    } catch {
      setErrorMessage('Unable to create category right now.')
      return null
    }
  }

  async function handleRenameCategory(categoryId: number, name: string): Promise<boolean> {
    if (familyId === null) {
      return false
    }

    setErrorMessage(null)

    try {
      await renameCategory(categoryId, familyId, name)
      await refreshCategories()
      return true
    } catch {
      setErrorMessage('Unable to rename category right now.')
      return false
    }
  }

  async function handleUpdateRetirementSettings(
    categoryId: number,
    settings: RetirementSettings,
  ): Promise<boolean> {
    if (familyId === null) {
      return false
    }

    setErrorMessage(null)

    try {
      await updateRetirementSettings(categoryId, familyId, settings)
      await refreshCategories()
      return true
    } catch {
      setErrorMessage('Unable to update retirement settings right now.')
      return false
    }
  }

  async function handleDeleteCategory(categoryId: number): Promise<boolean> {
    if (familyId === null) {
      return false
    }

    setErrorMessage(null)

    try {
      await deleteCategory(categoryId, familyId)
      setCategories((current) => current.filter((category) => category.id !== categoryId))
      return true
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to delete category right now.')
      return false
    }
  }

  return {
    categories,
    isLoading,
    errorMessage,
    createCategory: handleCreateCategory,
    renameCategory: handleRenameCategory,
    updateRetirementSettings: handleUpdateRetirementSettings,
    deleteCategory: handleDeleteCategory,
    refreshCategories,
  }
}
