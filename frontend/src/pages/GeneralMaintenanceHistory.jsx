import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import AttachmentDisplay from '../components/AttachmentDisplay'
import FileUpload from '../components/FileUpload'
import { vehicleAPI, generalMaintenanceAPI } from '../services/api'
import './GeneralMaintenanceHistory.css'

function GeneralMaintenanceHistory() {
  const { vehicleId } = useParams()
  const navigate = useNavigate()

  const [vehicle, setVehicle] = useState(null)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingRecordId, setEditingRecordId] = useState(null)
  const [editFormData, setEditFormData] = useState({
    title: '',
    date_performed: '',
    mileage: '',
    cost: '',
    notes: ''
  })
  const [newAttachments, setNewAttachments] = useState([])

  useEffect(() => {
    loadData()
  }, [vehicleId])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load vehicle and general maintenance records
      const [vehicleRes, recordsRes] = await Promise.all([
        vehicleAPI.getById(vehicleId),
        generalMaintenanceAPI.getAll(vehicleId)
      ])

      setVehicle(vehicleRes.data)
      setRecords(recordsRes.data.sort((a, b) =>
        new Date(b.date_performed) - new Date(a.date_performed)
      ))
    } catch (err) {
      setError('Failed to load general maintenance history')
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (record) => {
    setEditingRecordId(record.id)
    setEditFormData({
      title: record.title,
      date_performed: record.date_performed,
      mileage: record.mileage || '',
      cost: record.cost || '',
      notes: record.notes || ''
    })
  }

  const handleCancelEdit = () => {
    setEditingRecordId(null)
    setEditFormData({
      title: '',
      date_performed: '',
      mileage: '',
      cost: '',
      notes: ''
    })
    setNewAttachments([])
  }

  const handleEditFormChange = (e) => {
    const { name, value } = e.target
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleRemoveNewAttachment = (index) => {
    setNewAttachments(newAttachments.filter((_, i) => i !== index))
  }

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm('Are you sure you want to delete this attachment?')) {
      return
    }

    try {
      await generalMaintenanceAPI.deleteAttachment(attachmentId)
      // Reload data to refresh the attachments
      loadData()
    } catch (err) {
      setError('Failed to delete attachment')
      console.error('Error deleting attachment:', err)
    }
  }

  const handleSaveEdit = async (recordId) => {
    try {
      // Only use FormData if there's a file to upload, otherwise use JSON
      let submitData
      if (newAttachments.length > 0) {
        // Has file - use FormData
        submitData = new FormData()
        submitData.append('title', editFormData.title)
        submitData.append('date_performed', editFormData.date_performed)
        if (editFormData.mileage) {
          submitData.append('mileage', editFormData.mileage)
        }
        if (editFormData.cost) {
          submitData.append('cost', editFormData.cost)
        }
        if (editFormData.notes) {
          submitData.append('notes', editFormData.notes)
        }
        // Add new attachments
        newAttachments.forEach(file => {
          submitData.append('attachments', file)
        })
      } else {
        // No file - use JSON
        submitData = {
          title: editFormData.title,
          date_performed: editFormData.date_performed,
          mileage: editFormData.mileage || null,
          cost: editFormData.cost || null,
          notes: editFormData.notes || null
        }
      }

      const response = await generalMaintenanceAPI.update(recordId, submitData)

      // Update the record in the list
      setRecords(records.map(record => record.id === recordId ? response.data : record))
      setEditingRecordId(null)
      setEditFormData({
        title: '',
        date_performed: '',
        mileage: '',
        cost: '',
        notes: ''
      })
      setNewAttachments([])
    } catch (err) {
      setError('Failed to update record')
      console.error('Error updating record:', err)
    }
  }

  const handleDelete = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this general maintenance record?')) {
      return
    }

    try {
      await generalMaintenanceAPI.delete(recordId)
      setRecords(records.filter(record => record.id !== recordId))
    } catch (err) {
      setError('Failed to delete record')
      console.error('Error deleting record:', err)
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

  if (error || !vehicle) {
    return (
      <div className="general-maintenance-history-page">
        <div className="error-alert">{error || 'Data not found'}</div>
        <Button onClick={() => navigate(`/vehicle/${vehicleId}`)}>
          Back to Vehicle
        </Button>
      </div>
    )
  }

  return (
    <div className="general-maintenance-history-page">
      <div className="page-header">
        <div>
          <h2>General Maintenance History</h2>
          <p className="vehicle-name">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </p>
        </div>
        <div className="header-actions">
          <Button
            onClick={() => navigate('/general-maintenance', {
              state: { vehicleId: vehicle.id }
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

      {records.length === 0 ? (
        <div className="empty-state">
          <h3>No general maintenance logged yet</h3>
          <p>Add one-off repairs, services, or modifications here.</p>
          <Button
            onClick={() => navigate('/general-maintenance', {
              state: { vehicleId: vehicle.id }
            })}
          >
            Log First Record
          </Button>
        </div>
      ) : (
        <div className="records-list">
          <div className="records-summary">
            <h3>Maintenance History ({records.length} {records.length === 1 ? 'record' : 'records'})</h3>
          </div>

          {records.map((record) => (
            <div key={record.id} className="record-card">
              {editingRecordId === record.id ? (
                // Edit mode
                <div className="record-edit-form">
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      name="title"
                      value={editFormData.title}
                      onChange={handleEditFormChange}
                      required
                    />
                  </div>

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
                    <label>Cost (optional)</label>
                    <input
                      type="number"
                      name="cost"
                      value={editFormData.cost}
                      onChange={handleEditFormChange}
                      placeholder="e.g., 45.99"
                      step="0.01"
                      min="0"
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

                  {record.attachments && record.attachments.length > 0 && (
                    <AttachmentDisplay
                      attachments={record.attachments}
                      onDelete={handleDeleteAttachment}
                      showDelete={true}
                    />
                  )}

                  <FileUpload
                    files={newAttachments}
                    onChange={setNewAttachments}
                    onRemove={handleRemoveNewAttachment}
                    label="Add More Attachments"
                  />

                  <div className="record-actions">
                    <Button
                      variant="primary"
                      onClick={() => handleSaveEdit(record.id)}
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
                  <div className="record-header">
                    <h3 className="record-title">{record.title}</h3>
                    <div className="record-date">
                      <span className="date-label">Date:</span>
                      <span className="date-value">{formatDate(record.date_performed)}</span>
                    </div>
                  </div>

                  <div className="record-details">
                    {record.mileage && (
                      <div className="record-mileage">
                        <span className="mileage-value">{record.mileage.toLocaleString()}</span>
                        <span className="mileage-unit">miles</span>
                      </div>
                    )}
                    {record.cost && (
                      <div className="record-cost">
                        <span className="cost-label">Cost:</span>
                        <span className="cost-value">${parseFloat(record.cost).toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  {record.notes && (
                    <div className="record-notes">
                      <span className="notes-label">Notes:</span>
                      <p>{record.notes}</p>
                    </div>
                  )}

                  {record.attachments && record.attachments.length > 0 && (
                    <AttachmentDisplay attachments={record.attachments} />
                  )}

                  <div className="record-actions">
                    <Button
                      variant="outline"
                      onClick={() => handleEdit(record)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDelete(record.id)}
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

export default GeneralMaintenanceHistory
