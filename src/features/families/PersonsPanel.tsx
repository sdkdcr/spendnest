import { useState } from 'react'
import type { FormEvent } from 'react'
import { Modal } from '../../shared/ui/Modal'
import { usePersons } from './usePersons'

interface PersonsPanelProps {
  familyId: number | null
  familyName: string | null
}

export function PersonsPanel({ familyId, familyName }: PersonsPanelProps) {
  const { persons, isLoading, errorMessage, createPerson, renamePerson, deletePerson } =
    usePersons(familyId)

  const [newPersonName, setNewPersonName] = useState('')
  const [isCreatePersonModalOpen, setIsCreatePersonModalOpen] = useState(false)
  const [editingPersonId, setEditingPersonId] = useState<number | null>(null)
  const [editingPersonName, setEditingPersonName] = useState('')

  async function handleCreatePerson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedName = newPersonName.trim()
    if (!normalizedName) {
      return
    }

    const created = await createPerson(normalizedName)
    if (created) {
      setNewPersonName('')
      setIsCreatePersonModalOpen(false)
    }
  }

  async function handleSavePersonRename(personId: number) {
    const normalizedName = editingPersonName.trim()
    if (!normalizedName) {
      return
    }

    const updated = await renamePerson(personId, normalizedName)
    if (updated) {
      setEditingPersonId(null)
      setEditingPersonName('')
    }
  }

  async function handleDeletePerson(personId: number) {
    const shouldDelete = window.confirm('Delete this person from the active family?')
    if (!shouldDelete) {
      return
    }

    await deletePerson(personId)
  }

  return (
    <div className="persons-panel">
      <div>
        <h3>Persons</h3>
        <p className="families-help">
          {familyName
            ? `Manage members for ${familyName}.`
            : 'Select a family to manage persons.'}
        </p>
      </div>

      <div className="persons-toolbar">
        <button
          className="families-button families-button-primary"
          type="button"
          disabled={familyId === null}
          onClick={() => {
            setIsCreatePersonModalOpen(true)
          }}
        >
          Add Person
        </button>
      </div>

      {isCreatePersonModalOpen ? (
        <Modal
          title="Add Person"
          onClose={() => {
            setIsCreatePersonModalOpen(false)
          }}
        >
          <form className="persons-create-form" onSubmit={handleCreatePerson}>
            <input
              className="families-input"
              value={newPersonName}
              onChange={(event) => {
                setNewPersonName(event.currentTarget.value)
              }}
              placeholder="e.g. Deepak"
            />
            <div className="families-create-actions">
              <button
                className="families-button families-button-primary"
                type="submit"
              >
                Add Person
              </button>
              <button
                className="families-button"
                type="button"
                onClick={() => {
                  setIsCreatePersonModalOpen(false)
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
        <p className="families-help">No active family selected.</p>
      ) : isLoading ? (
        <p className="families-help">Loading persons...</p>
      ) : persons.length === 0 ? (
        <p className="families-help">No persons added yet.</p>
      ) : (
        <ul className="persons-list">
          {persons.map((person) => {
            const personId = person.id
            if (personId === undefined) {
              return null
            }

            const isEditing = editingPersonId === personId

            return (
              <li className="person-item" key={personId}>
                <div className="person-row">
                  <span className="person-name">{person.name}</span>

                  <div className="family-actions">
                    <button
                      className="families-button"
                      type="button"
                      onClick={() => {
                        setEditingPersonId(personId)
                        setEditingPersonName(person.name)
                      }}
                    >
                      Rename
                    </button>
                    <button
                      className="families-button"
                      type="button"
                      onClick={() => {
                        void handleDeletePerson(personId)
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
                      value={editingPersonName}
                      onChange={(event) => {
                        setEditingPersonName(event.currentTarget.value)
                      }}
                    />
                    <button
                      className="families-button families-button-primary"
                      type="button"
                      onClick={() => {
                        void handleSavePersonRename(personId)
                      }}
                    >
                      Save
                    </button>
                    <button
                      className="families-button"
                      type="button"
                      onClick={() => {
                        setEditingPersonId(null)
                        setEditingPersonName('')
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
    </div>
  )
}
