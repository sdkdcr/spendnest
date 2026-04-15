import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useAppStore } from '../../shared/state/useAppStore'
import { PersonsPanel } from './PersonsPanel'
import { useFamilies } from './useFamilies'
import './families.css'

export function FamiliesPage() {
  const {
    families,
    isLoading,
    errorMessage,
    createFamily,
    renameFamily,
    deleteFamily,
  } = useFamilies()
  const selectedFamilyId = useAppStore((state) => state.selectedFamilyId)
  const setSelectedFamilyId = useAppStore((state) => state.setSelectedFamilyId)

  const [newFamilyName, setNewFamilyName] = useState('')
  const [editingFamilyId, setEditingFamilyId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')

  useEffect(() => {
    if (families.length === 0) {
      setSelectedFamilyId(null)
      return
    }

    const hasSelectedFamily = families.some((family) => family.id === selectedFamilyId)
    if (!hasSelectedFamily) {
      setSelectedFamilyId(families[0].id ?? null)
    }
  }, [families, selectedFamilyId, setSelectedFamilyId])

  const selectedFamilyName = useMemo(() => {
    if (selectedFamilyId === null) {
      return null
    }

    return families.find((family) => family.id === selectedFamilyId)?.name ?? null
  }, [families, selectedFamilyId])

  async function handleCreateFamily(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedName = newFamilyName.trim()
    if (!normalizedName) {
      return
    }

    const createdFamily = await createFamily(normalizedName)
    if (createdFamily?.id !== undefined) {
      setSelectedFamilyId(createdFamily.id)
    }

    setNewFamilyName('')
  }

  async function handleDeleteFamily(familyId: number) {
    const shouldDelete = window.confirm(
      'Delete this family and all associated records?',
    )

    if (!shouldDelete) {
      return
    }

    const deleted = await deleteFamily(familyId)
    if (!deleted) {
      return
    }

    if (selectedFamilyId === familyId) {
      setSelectedFamilyId(null)
    }
  }

  async function handleSaveFamilyRename(familyId: number) {
    const normalizedName = editingName.trim()
    if (!normalizedName) {
      return
    }

    const updated = await renameFamily(familyId, normalizedName)
    if (updated) {
      setEditingFamilyId(null)
      setEditingName('')
    }
  }

  return (
    <section className="families-layout">
      <div>
        <h2>Families</h2>
        <p className="families-help">
          Create and manage households for grouping monthly spends.
        </p>
      </div>

      <form className="families-create-form" onSubmit={handleCreateFamily}>
        <div className="field">
          <label htmlFor="family-name">New family name</label>
          <input
            id="family-name"
            className="families-input"
            value={newFamilyName}
            onChange={(event) => {
              setNewFamilyName(event.currentTarget.value)
            }}
            placeholder="e.g. Home Budget"
          />
        </div>

        <button className="families-button families-button-primary" type="submit">
          Add Family
        </button>
      </form>

      {selectedFamilyName ? (
        <p className="families-help">Active family: {selectedFamilyName}</p>
      ) : null}

      {errorMessage ? <p className="families-error">{errorMessage}</p> : null}

      {isLoading ? (
        <p className="families-help">Loading families...</p>
      ) : (
        <ul className="families-list">
          {families.map((family) => {
            const familyId = family.id
            if (familyId === undefined) {
              return null
            }

            const isEditing = editingFamilyId === familyId
            const isSelected = selectedFamilyId === familyId

            return (
              <li className="family-item" key={familyId}>
                <div className="family-row">
                  <div className="family-meta">
                    <span className="family-name">{family.name}</span>
                    {isSelected ? <span className="family-tag">Active</span> : null}
                  </div>

                  <div className="family-actions">
                    <button
                      className="families-button"
                      type="button"
                      onClick={() => {
                        setSelectedFamilyId(familyId)
                      }}
                    >
                      Use
                    </button>
                    <button
                      className="families-button"
                      type="button"
                      onClick={() => {
                        setEditingFamilyId(familyId)
                        setEditingName(family.name)
                      }}
                    >
                      Rename
                    </button>
                    <button
                      className="families-button"
                      type="button"
                      onClick={() => {
                        void handleDeleteFamily(familyId)
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
                      value={editingName}
                      onChange={(event) => {
                        setEditingName(event.currentTarget.value)
                      }}
                    />
                    <button
                      className="families-button families-button-primary"
                      type="button"
                      onClick={() => {
                        void handleSaveFamilyRename(familyId)
                      }}
                    >
                      Save
                    </button>
                    <button
                      className="families-button"
                      type="button"
                      onClick={() => {
                        setEditingFamilyId(null)
                        setEditingName('')
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
      )}

      <PersonsPanel familyId={selectedFamilyId} familyName={selectedFamilyName} />
    </section>
  )
}
