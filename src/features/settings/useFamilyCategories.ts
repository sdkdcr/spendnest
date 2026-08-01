import { useCallback, useEffect, useState } from 'react'
import type { Category } from '../../shared/domain/types'
import { listCategoriesByFamily } from './category.repository'

export function useFamilyCategories(familyId: number | null) {
  const [categories, setCategories] = useState<Category[]>([])

  const refreshCategories = useCallback(async () => {
    if (familyId === null) {
      setCategories([])
      return
    }

    const nextCategories = await listCategoriesByFamily(familyId)
    setCategories(nextCategories)
  }, [familyId])

  useEffect(() => {
    let isCancelled = false

    async function loadCategories() {
      if (familyId === null) {
        setCategories([])
        return
      }

      const nextCategories = await listCategoriesByFamily(familyId)
      if (!isCancelled) {
        setCategories(nextCategories)
      }
    }

    void loadCategories()

    return () => {
      isCancelled = true
    }
  }, [familyId])

  return { categories, refreshCategories }
}
