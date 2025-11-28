import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Input from '../components/Input'
import TextArea from '../components/TextArea'
import Button from '../components/Button'
import FileUpload from '../components/FileUpload'
import Select from '../components/Select'
import { vehicleAPI, generalMaintenanceAPI } from '../services/api'
import './GeneralMaintenance.css'

function GeneralMaintenance() {
  const navigate = useNavigate()
  const location = useLocation()

  // Get pre-selected vehicle from navigation state
  const preSelectedVehicleId = location.state?.vehicleId

  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    vehicle_id: preSelectedVehicleId || '',
    description: '',
    date_performed: new Date().toISOString().split('T')[0],
    mileage: '',
    cost: '',
    notes: ''
  })

  const [attachments, setAttachments] = useState([])

  useEffect(() => {
    loadVehicles()
  }, [])

  const loadVehicles = async () => {
    try {
      setLoading(true)
      const response = await vehicleAPI.getAll()
      setVehicles(response.data)

      // If we have a pre-selected vehicle, load its current mileage
      if (preSelectedVehicleId) {
        const vehicle = response.data.find(v => v.id === preSelectedVehicleId)
        if (vehicle) {
          setFormData(prev => ({
            ...prev,
            mileage: vehicle.current_mileage.toString()
          }))
        }
      }
    } catch (err) {
      setError('Failed to load vehicles')
      console.error('Error loading vehicles:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // When vehicle changes, update mileage
    if (name === 'vehicle_id') {
      const vehicle = vehicles.find(v => v.id === parseInt(value))
      if (vehicle) {
        setFormData(prev => ({
          ...prev,
          mileage: vehicle.current_mileage.toString()
        }))
      }
    }
  }

  const handleRemoveAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      // Create FormData for file upload
      const submitData = new FormData()
      submitData.append('vehicle_id', formData.vehicle_id)
      submitData.append('description', formData.description)
      submitData.append('date_performed', formData.date_performed)
      submitData.append('mileage', formData.mileage)
      if (formData.cost) {
        submitData.append('cost', formData.cost)
      }
      if (formData.notes) {
        submitData.append('notes', formData.notes)
      }
      // Add multiple attachments
      attachments.forEach(file => {
        submitData.append('attachments', file)
      })

      await generalMaintenanceAPI.create(submitData)

      setSuccess(true)

      // Redirect back to vehicle detail page after a brief delay
      setTimeout(() => {
        navigate(`/vehicle/${formData.vehicle_id}`)
      }, 1500)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to log general maintenance')
      console.error('Error logging general maintenance:', err)
      setSubmitting(false)
    }
  }

  const selectedVehicle = vehicles.find(v => v.id === parseInt(formData.vehicle_id))

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (success) {
    return (
      <div className="general-maintenance-page">
        <div className="success-message">
          <h2>✓ General Maintenance Logged Successfully!</h2>
          <p>Redirecting back to vehicle details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="general-maintenance-page">
      <div className="page-header">
        <h2>Log General Maintenance</h2>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </div>

      {error && (
        <div className="error-alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="general-maintenance-form">
        <div className="form-section">
          <h3>Select Vehicle</h3>

          <Select
            label="Vehicle"
            name="vehicle_id"
            value={formData.vehicle_id}
            onChange={handleChange}
            options={[
              { value: '', label: 'Select a vehicle...' },
              ...vehicles.map(v => ({
                value: v.id.toString(),
                label: `${v.year} ${v.make} ${v.model}`
              }))
            ]}
            required
          />
        </div>

        {formData.vehicle_id && (
          <>
            <div className="form-section">
              <h3>Maintenance Details</h3>

              <Input
                label="Title"
                name="description"
                type="text"
                value={formData.description}
                onChange={handleChange}
                placeholder="e.g., AC Repair, Body Work, Tire Replacement"
                required
              />

              <div className="form-row-2col">
                <Input
                  label="Date Performed"
                  name="date_performed"
                  type="date"
                  value={formData.date_performed}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />

                <Input
                  label="Current Mileage"
                  name="mileage"
                  type="number"
                  value={formData.mileage}
                  onChange={handleChange}
                  placeholder="e.g., 25000"
                  min="0"
                  required
                />
              </div>

              {selectedVehicle && (
                <p className="mileage-hint">
                  Vehicle's last recorded mileage: {selectedVehicle.current_mileage.toLocaleString()} miles
                </p>
              )}

              <Input
                label="Cost (Optional)"
                name="cost"
                type="number"
                value={formData.cost}
                onChange={handleChange}
                placeholder="e.g., 299.99"
                min="0"
                step="0.01"
              />

              <TextArea
                label="Notes (Optional)"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="e.g., Description of work performed, parts replaced, shop visited..."
                rows={4}
              />
            </div>

            <div className="form-section">
              <FileUpload
                files={attachments}
                onChange={setAttachments}
                onRemove={handleRemoveAttachment}
                label="Receipts & Documents"
              />
            </div>

            <div className="form-footer">
              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
                fullWidth
              >
                {submitting ? 'Logging Maintenance...' : 'Log Maintenance'}
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  )
}

export default GeneralMaintenance
