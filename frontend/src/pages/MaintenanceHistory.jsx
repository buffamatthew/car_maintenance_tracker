import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import { vehicleAPI, maintenanceItemAPI, maintenanceLogAPI } from '../services/api'
import './MaintenanceHistory.css'

function MaintenanceHistory() {
  const { vehicleId, itemId } = useParams()
  const navigate = useNavigate()

  const [vehicle, setVehicle] = useState(null)
  const [maintenanceItem, setMaintenanceItem] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingLogId, setEditingLogId] = useState(null)
  const [editFormData, setEditFormData] = useState({
    date_performed: '',
    mileage: '',
    notes: '',
    receipt_photo: null,
    remove_receipt: false
  })

  useEffect(() => {
    loadData()
  }, [vehicleId, itemId])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load vehicle, maintenance item, and logs
      const [vehicleRes, itemRes, logsRes] = await Promise.all([
        vehicleAPI.getById(vehicleId),
        maintenanceItemAPI.getById(itemId),
        maintenanceLogAPI.getAll(itemId)
      ])

      setVehicle(vehicleRes.data)
      setMaintenanceItem(itemRes.data)
      setLogs(logsRes.data.sort((a, b) =>
        new Date(b.date_performed) - new Date(a.date_performed)
      ))
    } catch (err) {
      setError('Failed to load maintenance history')
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (log) => {
    setEditingLogId(log.id)
    setEditFormData({
      date_performed: log.date_performed,
      mileage: log.mileage || '',
      notes: log.notes || '',
      receipt_photo: null,
      remove_receipt: false
    })
  }

  const handleCancelEdit = () => {
    setEditingLogId(null)
    setEditFormData({
      date_performed: '',
      mileage: '',
      notes: '',
      receipt_photo: null,
      remove_receipt: false
    })
  }

  const handleRemoveReceipt = () => {
    setEditFormData(prev => ({
      ...prev,
      receipt_photo: null,
      remove_receipt: true
    }))
  }

  const handleEditFormChange = (e) => {
    const { name, value } = e.target
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    setEditFormData(prev => ({
      ...prev,
      receipt_photo: file
    }))
  }

  const handleSaveEdit = async (logId) => {
    try {
      // Only use FormData if there's a file to upload, otherwise use JSON
      let submitData
      if (editFormData.receipt_photo) {
        // Has file - use FormData
        submitData = new FormData()
        submitData.append('date_performed', editFormData.date_performed)
        if (editFormData.mileage) {
          submitData.append('mileage', editFormData.mileage)
        }
        if (editFormData.notes) {
          submitData.append('notes', editFormData.notes)
        }
        submitData.append('receipt_photo', editFormData.receipt_photo)
      } else {
        // No file - use JSON
        submitData = {
          date_performed: editFormData.date_performed,
          mileage: editFormData.mileage || null,
          notes: editFormData.notes || null,
          remove_receipt: editFormData.remove_receipt
        }
      }

      const response = await maintenanceLogAPI.update(logId, submitData)

      // Update the log in the list
      setLogs(logs.map(log => log.id === logId ? response.data : log))
      setEditingLogId(null)
      setEditFormData({
        date_performed: '',
        mileage: '',
        notes: '',
        receipt_photo: null,
        remove_receipt: false
      })
    } catch (err) {
      setError('Failed to update log')
      console.error('Error updating log:', err)
    }
  }

  const handleDelete = async (logId) => {
    if (!window.confirm('Are you sure you want to delete this maintenance log?')) {
      return
    }

    try {
      await maintenanceLogAPI.delete(logId)
      setLogs(logs.filter(log => log.id !== logId))
    } catch (err) {
      setError('Failed to delete log')
      console.error('Error deleting log:', err)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return <div className="loading">Loading history...</div>
  }

  if (error || !vehicle || !maintenanceItem) {
    return (
      <div className="maintenance-history-page">
        <div className="error-alert">{error || 'Data not found'}</div>
        <Button onClick={() => navigate(`/vehicle/${vehicleId}`)}>
          Back to Vehicle
        </Button>
      </div>
    )
  }

  return (
    <div className="maintenance-history-page">
      <div className="page-header">
        <div>
          <h2>{maintenanceItem.name} History</h2>
          <p className="vehicle-name">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </p>
          <p className="frequency-info">
            Frequency: Every {maintenanceItem.frequency_value} {maintenanceItem.frequency_unit}
          </p>
        </div>
        <div className="header-actions">
          <Button
            onClick={() => navigate('/maintenance-log', {
              state: { vehicleId: vehicle.id, itemId: maintenanceItem.id }
            })}
          >
            + Log New
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/vehicle/${vehicleId}`)}
          >
            Back to Vehicle
          </Button>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="empty-state">
          <h3>No maintenance logged yet</h3>
          <p>This maintenance item has never been performed.</p>
          <Button
            onClick={() => navigate('/maintenance-log', {
              state: { vehicleId: vehicle.id, itemId: maintenanceItem.id }
            })}
          >
            Log First Maintenance
          </Button>
        </div>
      ) : (
        <div className="logs-list">
          <div className="logs-summary">
            <h3>Maintenance History ({logs.length} {logs.length === 1 ? 'entry' : 'entries'})</h3>
          </div>

          {logs.map((log) => (
            <div key={log.id} className="log-card">
              {editingLogId === log.id ? (
                // Edit mode
                <div className="log-edit-form">
                  <div className="form-group">
                    <label>Date Performed</label>
                    <input
                      type="date"
                      name="date_performed"
                      value={editFormData.date_performed}
                      onChange={handleEditFormChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Mileage (optional)</label>
                    <input
                      type="number"
                      name="mileage"
                      value={editFormData.mileage}
                      onChange={handleEditFormChange}
                      placeholder="e.g., 50000"
                    />
                  </div>

                  <div className="form-group">
                    <label>Notes (optional)</label>
                    <textarea
                      name="notes"
                      value={editFormData.notes}
                      onChange={handleEditFormChange}
                      rows="3"
                      placeholder="Add any notes about this maintenance..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Receipt Photo (optional)</label>
                    {log.receipt_photo && !editFormData.remove_receipt && (
                      <div className="current-receipt-info">
                        <span>Current receipt: {log.receipt_photo}</span>
                        <Button
                          variant="danger"
                          onClick={handleRemoveReceipt}
                          type="button"
                        >
                          Remove Receipt
                        </Button>
                      </div>
                    )}
                    {editFormData.remove_receipt && (
                      <div className="receipt-removed-message">
                        Receipt will be removed when you save
                      </div>
                    )}
                    {!editFormData.remove_receipt && (
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                      />
                    )}
                  </div>

                  <div className="log-actions">
                    <Button
                      variant="primary"
                      onClick={() => handleSaveEdit(log.id)}
                    >
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                // View mode
                <>
                  <div className="log-header">
                    <div className="log-date">
                      <span className="date-label">Date:</span>
                      <span className="date-value">{formatDate(log.date_performed)}</span>
                    </div>
                    {log.mileage && (
                      <div className="log-mileage">
                        <span className="mileage-value">{log.mileage.toLocaleString()}</span>
                        <span className="mileage-unit">miles</span>
                      </div>
                    )}
                  </div>

                  {log.notes && (
                    <div className="log-notes">
                      <span className="notes-label">Notes:</span>
                      <p>{log.notes}</p>
                    </div>
                  )}

                  {log.receipt_photo && (
                    <div className="log-receipt">
                      <span className="receipt-label">Receipt:</span>
                      <div className="receipt-preview">
                        {log.receipt_photo.toLowerCase().endsWith('.pdf') ? (
                          <a
                            href={`http://localhost:5001/uploads/${log.receipt_photo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="receipt-link"
                          >
                            📄 View PDF Receipt
                          </a>
                        ) : (
                          <a
                            href={`http://localhost:5001/uploads/${log.receipt_photo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={`http://localhost:5001/uploads/${log.receipt_photo}`}
                              alt="Receipt"
                              className="receipt-image"
                            />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="log-actions">
                    <Button
                      variant="outline"
                      onClick={() => handleEdit(log)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDelete(log.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MaintenanceHistory
