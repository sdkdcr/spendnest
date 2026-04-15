import { useCallback, useEffect, useState } from 'react'
import type { Family } from '../../shared/domain/types'
import {
  createFamily,
  deleteFamily,
  listFamilies,
  renameFamily,
} from './family.repository'

export function useFamilies() {
  const [families, setFamilies] = useState<Family[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const refreshFamilies = useCallback(async () => {
    setErrorMessage(null)

    try {
      const nextFamilies = await listFamilies()
      setFamilies(nextFamilies)
    } catch {
      setErrorMessage('Unable to load families right now.')
    }
  }, [])

  useEffect(() => {
    async function initFamilies() {
      setIsLoading(true)
      await refreshFamilies()
      setIsLoading(false)
    }

    void initFamilies()
  }, [refreshFamilies])

  async function handleCreateFamily(name: string): Promise<Family | null> {
    setErrorMessage(null)

    try {
      const createdFamily = await createFamily(name)
      setFamilies((currentFamilies) => [createdFamily, ...currentFamilies])
      return createdFamily
    } catch {
      setErrorMessage('Unable to create family right now.')
      return null
    }
  }

  async function handleRenameFamily(
    familyId: number,
    name: string,
  ): Promise<boolean> {
    setErrorMessage(null)

    try {
      await renameFamily(familyId, name)
      const refreshedFamilies = await listFamilies()
      setFamilies(refreshedFamilies)
      return true
    } catch {
      setErrorMessage('Unable to update family right now.')
      return false
    }
  }

  async function handleDeleteFamily(familyId: number): Promise<boolean> {
    setErrorMessage(null)

    try {
      await deleteFamily(familyId)
      setFamilies((currentFamilies) =>
        currentFamilies.filter((family) => family.id !== familyId),
      )
      return true
    } catch {
      setErrorMessage('Unable to delete family right now.')
      return false
    }
  }

  return {
    families,
    isLoading,
    errorMessage,
    createFamily: handleCreateFamily,
    renameFamily: handleRenameFamily,
    deleteFamily: handleDeleteFamily,
    refreshFamilies,
  }
}
