import { useCallback, useEffect, useState } from 'react'
import type { SpendTemplate } from '../../shared/domain/types'
import {
  createSpendTemplate,
  deleteSpendTemplate,
  listSpendTemplatesByFamily,
  updateSpendTemplate,
  type SpendTemplateDraft,
} from './spend-template.repository'

export function useSpendTemplates(familyId: number | null) {
  const [spendTemplates, setSpendTemplates] = useState<SpendTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const refreshSpendTemplates = useCallback(async () => {
    if (familyId === null) {
      setSpendTemplates([])
      return
    }

    setErrorMessage(null)

    try {
      const nextTemplates = await listSpendTemplatesByFamily(familyId)
      setSpendTemplates(nextTemplates)
    } catch {
      setErrorMessage('Unable to load spend templates right now.')
    }
  }, [familyId])

  useEffect(() => {
    async function initSpendTemplates() {
      if (familyId === null) {
        setSpendTemplates([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      await refreshSpendTemplates()
      setIsLoading(false)
    }

    void initSpendTemplates()
  }, [familyId, refreshSpendTemplates])

  async function handleCreateSpendTemplate(
    draft: SpendTemplateDraft,
  ): Promise<SpendTemplate | null> {
    if (familyId === null) {
      return null
    }

    setErrorMessage(null)

    try {
      const created = await createSpendTemplate(familyId, draft)
      setSpendTemplates((currentTemplates) => [created, ...currentTemplates])
      return created
    } catch {
      setErrorMessage('Unable to create spend template right now.')
      return null
    }
  }

  async function handleUpdateSpendTemplate(
    templateId: number,
    draft: SpendTemplateDraft,
  ): Promise<boolean> {
    if (familyId === null) {
      return false
    }

    setErrorMessage(null)

    try {
      await updateSpendTemplate(templateId, draft)
      const refreshed = await listSpendTemplatesByFamily(familyId)
      setSpendTemplates(refreshed)
      return true
    } catch {
      setErrorMessage('Unable to update spend template right now.')
      return false
    }
  }

  async function handleDeleteSpendTemplate(templateId: number): Promise<boolean> {
    setErrorMessage(null)

    try {
      await deleteSpendTemplate(templateId)
      setSpendTemplates((currentTemplates) =>
        currentTemplates.filter((template) => template.id !== templateId),
      )
      return true
    } catch {
      setErrorMessage('Unable to delete spend template right now.')
      return false
    }
  }

  return {
    spendTemplates,
    isLoading,
    errorMessage,
    createSpendTemplate: handleCreateSpendTemplate,
    updateSpendTemplate: handleUpdateSpendTemplate,
    deleteSpendTemplate: handleDeleteSpendTemplate,
    refreshSpendTemplates,
  }
}
