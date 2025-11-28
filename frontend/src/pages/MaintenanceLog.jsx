import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Input from '../components/Input'
import Select from '../components/Select'
import TextArea from '../components/TextArea'
import Button from '../components/Button'
import { vehicleAPI, maintenanceItemAPI, maintenanceLogAPI } from '../services/api'
import './MaintenanceLog.css'

function MaintenanceLog() {
  const navigate = useNavigate()
  const location = useLocation()

  // Get pre-selected vehicle/item from navigation state
  const preSelectedVehicleId = location.state?.vehicleId
  const preSelectedItemId = location.state?.itemId

  const [vehicles, setVehicles] = useState([])
  const [maintenanceItems, setMaintenanceItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    vehicle_id: preSelectedVehicleId || '',
    maintenance_item_id: preSelectedItemId || '',
    date_performed: new Date().toISOString().split('T')[0], // Today's date
    mileage: '',
    cost: '',
    notes: '',
    receipt_photo: null
  })

  useEffect(() => {
    loadVehicles()
  }, [])

  useEffect(() => {
    if (formData.vehicle_id) {
      loadMaintenanceItems(formData.vehicle_id)
    }
  }, [formData.vehicle_id])

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

  const loadMaintenanceItems = async (vehicleId) => {
    try {
      const response = await maintenanceItemAPI.getAll(vehicleId)
      setMaintenanceItems(response.data)
    } catch (err) {
      setError('Failed to load maintenance items')
      console.error('Error loading maintenance items:', err)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // When vehicle changes, reset maintenance item and load new items
    if (name === 'vehicle_id') {
      setFormData(prev => ({
        ...prev,
        maintenance_item_id: ''
      }))

      // Update mileage to match selected vehicle
      const vehicle = vehicles.find(v => v.id === parseInt(value))
      if (vehicle) {
        setFormData(prev => ({
          ...prev,
          mileage: vehicle.current_mileage.toString()
        }))
      }
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    setFormData(prev => ({
      ...prev,
      receipt_photo: file
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      // Create FormData for file upload
      const submitData = new FormData()
      submitData.append('maintenance_item_id', formData.maintenance_item_id)
      submitData.append('date_performed', formData.date_performed)
      submitData.append('mileage', formData.mileage)
      if (formData.cost) {
        submitData.append('cost', formData.cost)
      }
      if (formData.notes) {
        submitData.append('notes', formData.notes)
      }
      if (formData.receipt_photo) {
        submitData.append('receipt_photo', formData.receipt_photo)
      }

      await maintenanceLogAPI.create(submitData)

      setSuccess(true)

      // Redirect back to vehicle detail page after a brief delay
      setTimeout(() => {
        navigate(`/vehicle/${formData.vehicle_id}`)
      }, 1500)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to log maintenance')
      console.error('Error logging maintenance:', err)
      setSubmitting(false)
    }
  }

  const selectedVehicle = vehicles.find(v => v.id === parseInt(formData.vehicle_id))

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (success) {
    return (
      <div className="maintenance-log-page">
        <div className="success-message">
          <h2>✓ Maintenance Logged Successfully!</h2>
          <p>Redirecting back to vehicle details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="maintenance-log-page">
      <div className="page-header">
        <h2>Log Maintenance</h2>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </div>

      {error && (
        <div className="error-alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="maintenance-log-form">
        <div className="form-section">
          <h3>Select Vehicle & Maintenance Item</h3>

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

          {formData.vehicle_id && (
            <Select
              label="Maintenance Item"
              name="maintenance_item_id"
              value={formData.maintenance_item_id}
              onChange={handleChange}
              options={[
                { value: '', label: 'Select a maintenance item...' },
                ...maintenanceItems.map(item => ({
                  value: item.id.toString(),
                  label: `${item.name} (Every ${item.frequency_value} ${item.frequency_unit})`
                }))
              ]}
              required
            />
          )}
        </div>

        {formData.maintenance_item_id && (
          <>
            <div className="form-section">
              <h3>Maintenance Details</h3>

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
                placeholder="e.g., 45.99"
                min="0"
                step="0.01"
              />

              <TextArea
                label="Notes (Optional)"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="e.g., Parts used, shop visited, any issues noticed..."
                rows={4}
              />
            </div>

            <div className="form-section">
              <h3>Receipt Photo (Optional)</h3>
              <div className="file-upload">
                <input
                  type="file"
                  id="receipt_photo"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="file-input"
                />
                <label htmlFor="receipt_photo" className="file-label">
                  {formData.receipt_photo
                    ? `✓ ${formData.receipt_photo.name}`
                    : '📎 Choose file or take photo'}
                </label>
                <p className="file-hint">
                  Accepted formats: JPG, PNG, PDF (max 16MB)
                </p>
              </div>
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

export default MaintenanceLog
