import { useRef, useState } from 'react'
import {
  exportBackupFile,
  parseBackupJson,
  restoreBackup,
} from './backup.service'

export function BackupPanel() {
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  async function handleExportBackup() {
    setIsBusy(true)
    setErrorMessage(null)
    setStatusMessage(null)

    try {
      await exportBackupFile()
      setStatusMessage('Backup exported successfully.')
    } catch {
      setErrorMessage('Unable to export backup right now.')
    } finally {
      setIsBusy(false)
    }
  }

  async function handleImportBackup() {
    const selectedFile = fileInputRef.current?.files?.[0]
    if (!selectedFile) {
      setErrorMessage('Please choose a backup file first.')
      setStatusMessage(null)
      return
    }

    const shouldReplace = window.confirm(
      'Import will replace existing local data. Do you want to continue?',
    )

    if (!shouldReplace) {
      return
    }

    setIsBusy(true)
    setErrorMessage(null)
    setStatusMessage(null)

    try {
      const rawContent = await selectedFile.text()
      const payload = parseBackupJson(rawContent)
      await restoreBackup(payload)
      setStatusMessage('Backup imported successfully. Reload app views if needed.')

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Import failed.'
      setErrorMessage(message)
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <div className="settings-backup-panel">
      <h3>Backup and Restore</h3>
      <p className="field-help">Backup format: JSON (`backupVersion: 1`).</p>

      <div className="settings-backup-actions">
        <button
          className="families-button families-button-primary"
          type="button"
          onClick={() => {
            void handleExportBackup()
          }}
          disabled={isBusy}
        >
          Export Backup (JSON)
        </button>
      </div>

      <div className="settings-backup-actions">
        <input ref={fileInputRef} type="file" accept="application/json,.json" />
        <button
          className="families-button"
          type="button"
          onClick={() => {
            void handleImportBackup()
          }}
          disabled={isBusy}
        >
          Import Backup (Replace)
        </button>
      </div>

      {statusMessage ? <p className="field-help">{statusMessage}</p> : null}
      {errorMessage ? <p className="families-error">{errorMessage}</p> : null}
    </div>
  )
}
