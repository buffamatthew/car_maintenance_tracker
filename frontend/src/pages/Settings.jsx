import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Input from '../components/Input'
import Select from '../components/Select'
import { backupAPI, settingsAPI } from '../services/api'
import './Settings.css'

function Settings() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importMode, setImportMode] = useState('merge')
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [savingEmail, setSavingEmail] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)

  const [emailSettings, setEmailSettings] = useState({
    notification_email: '',
    smtp_host: '',
    smtp_port: '587',
    smtp_username: '',
    smtp_password: '',
    smtp_use_tls: 'true',
    reminder_threshold_percent: '30',
    reminder_interval_days: '1',
  })

  useEffect(() => {
    loadEmailSettings()
  }, [])

  const loadEmailSettings = async () => {
    try {
      const response = await settingsAPI.get()
      setEmailSettings(prev => ({ ...prev, ...response.data }))
    } catch (err) {
      console.error('Error loading settings:', err)
    }
  }

  const handleEmailSettingChange = (e) => {
    const { name, value } = e.target
    setEmailSettings(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveEmailSettings = async () => {
    try {
      setSavingEmail(true)
      setMessage(null)
      setError(null)
      await settingsAPI.update(emailSettings)
      setMessage('Email settings saved successfully!')
    } catch (err) {
      setError('Failed to save email settings: ' + (err.response?.data?.error || err.message))
    } finally {
      setSavingEmail(false)
    }
  }

  const handleTestEmail = async () => {
    try {
      setTestingEmail(true)
      setMessage(null)
      setError(null)
      await settingsAPI.testEmail()
      setMessage('Test email sent! Check your inbox.')
    } catch (err) {
      setError('Failed to send test email: ' + (err.response?.data?.error || err.message))
    } finally {
      setTestingEmail(false)
    }
  }

  const handleExport = async () => {
    try {
      setExporting(true)
      setMessage(null)
      setError(null)

      const response = await backupAPI.export()

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url

      const contentDisposition = response.headers['content-disposition']
      let filename = 'upkeep_backup.json'
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      setMessage('Data exported successfully!')
    } catch (err) {
      setError('Failed to export data: ' + (err.response?.data?.error || err.message))
      console.error('Export error:', err)
    } finally {
      setExporting(false)
    }
  }

  const handleImportClick = () => {
    fileInputRef.current.click()
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.name.endsWith('.json')) {
      setError('Please select a JSON file')
      return
    }

    const confirmMessage = importMode === 'replace'
      ? 'This will DELETE ALL existing data and replace it with the backup. Are you sure?'
      : 'This will merge the backup data with your existing data. Continue?'

    if (!window.confirm(confirmMessage)) {
      e.target.value = ''
      return
    }

    try {
      setImporting(true)
      setMessage(null)
      setError(null)

      const response = await backupAPI.import(file, importMode)

      setMessage(
        `Import successful! Imported: ${response.data.counts.assets} assets, ` +
        `${response.data.counts.maintenance_items} items, ` +
        `${response.data.counts.maintenance_logs} logs, ` +
        `${response.data.counts.general_maintenance} general maintenance records. ` +
        response.data.note
      )

      e.target.value = ''
    } catch (err) {
      setError('Failed to import data: ' + (err.response?.data?.error || err.message))
      console.error('Import error:', err)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <h2>Settings & Backup</h2>
        <Button variant="outline" onClick={() => navigate('/')}>
          Back to Dashboard
        </Button>
      </div>

      {message && (
        <div className="success-alert">
          {message}
        </div>
      )}

      {error && (
        <div className="error-alert">
          {error}
        </div>
      )}

      <div className="settings-section">
        <h3>Email Notifications</h3>
        <p className="section-description">
          Configure email reminders for maintenance items that have reminders enabled.
        </p>

        <div className="email-settings-form">
          <Input
            label="Notification Email"
            name="notification_email"
            type="email"
            value={emailSettings.notification_email}
            onChange={handleEmailSettingChange}
            placeholder="your@email.com"
          />

          <h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>SMTP Settings</h4>
          <p className="section-description" style={{ marginBottom: '1rem' }}>
            For Gmail, use smtp.gmail.com with an App Password. For Outlook, use smtp.office365.com.
          </p>

          <div className="form-row-2col">
            <Input
              label="SMTP Host"
              name="smtp_host"
              value={emailSettings.smtp_host}
              onChange={handleEmailSettingChange}
              placeholder="smtp.gmail.com"
            />
            <Input
              label="SMTP Port"
              name="smtp_port"
              type="number"
              value={emailSettings.smtp_port}
              onChange={handleEmailSettingChange}
              placeholder="587"
            />
          </div>

          <div className="form-row-2col">
            <Input
              label="SMTP Username"
              name="smtp_username"
              value={emailSettings.smtp_username}
              onChange={handleEmailSettingChange}
              placeholder="your@email.com"
            />
            <Input
              label="SMTP Password"
              name="smtp_password"
              type="password"
              value={emailSettings.smtp_password}
              onChange={handleEmailSettingChange}
              placeholder="App password"
            />
          </div>

          <h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Reminder Settings</h4>

          <div className="form-row-2col">
            <Input
              label="Remind when below (%)"
              name="reminder_threshold_percent"
              type="number"
              value={emailSettings.reminder_threshold_percent}
              onChange={handleEmailSettingChange}
              min="1"
              max="100"
            />
            <Input
              label="Reminder interval (days)"
              name="reminder_interval_days"
              type="number"
              value={emailSettings.reminder_interval_days}
              onChange={handleEmailSettingChange}
              min="1"
            />
          </div>

          <div className="email-settings-actions">
            <Button
              onClick={handleSaveEmailSettings}
              disabled={savingEmail}
            >
              {savingEmail ? 'Saving...' : 'Save Email Settings'}
            </Button>
            <Button
              variant="outline"
              onClick={handleTestEmail}
              disabled={testingEmail}
            >
              {testingEmail ? 'Sending...' : 'Send Test Email'}
            </Button>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Data Backup</h3>
        <p className="section-description">
          Export your data to create a backup, or import a previous backup to restore your data.
        </p>

        <div className="backup-actions">
          <div className="backup-card">
            <h4>Export Data</h4>
            <p>Download all your assets, maintenance items, and logs as a JSON file.</p>
            <Button
              onClick={handleExport}
              disabled={exporting}
              fullWidth
            >
              {exporting ? 'Exporting...' : 'Export Backup'}
            </Button>
          </div>

          <div className="backup-card">
            <h4>Import Data</h4>
            <p>Restore data from a previous backup file.</p>

            <div className="import-mode-selector">
              <label className="radio-label">
                <input
                  type="radio"
                  name="importMode"
                  value="merge"
                  checked={importMode === 'merge'}
                  onChange={(e) => setImportMode(e.target.value)}
                />
                <span>Merge with existing data</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="importMode"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={(e) => setImportMode(e.target.value)}
                />
                <span>Replace all data (deletes existing)</span>
              </label>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".json"
              style={{ display: 'none' }}
            />

            <Button
              onClick={handleImportClick}
              disabled={importing}
              variant="outline"
              fullWidth
            >
              {importing ? 'Importing...' : 'Select Backup File'}
            </Button>
          </div>
        </div>

        <div className="backup-note">
          <strong>Note:</strong> Attachment files (photos, PDFs, etc.) are not included in backups.
          Only the metadata is saved. After restoring a backup, you'll need to re-upload any attachments.
        </div>
      </div>
    </div>
  )
}

export default Settings
