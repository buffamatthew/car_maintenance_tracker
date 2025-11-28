import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Input from '../components/Input'
import Select from '../components/Select'
import TextArea from '../components/TextArea'
import Button from '../components/Button'
import { maintenanceItemAPI, vehicleAPI } from '../services/api'
import './EditMaintenanceItem.css'

function EditMaintenanceItem() {
  const { vehicleId, itemId } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [vehicle, setVehicle] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    maintenance_type: 'mileage',
    frequency_value: '',
    frequency_unit: 'miles',
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [itemId, vehicleId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [itemRes, vehicleRes] = await Promise.all([
        maintenanceItemAPI.getById(itemId),
        vehicleAPI.getById(vehicleId)
      ])

      const item = itemRes.data
      setFormData({
        name: item.name,
        maintenance_type: item.maintenance_type,
        frequency_value: item.frequency_value,
        frequency_unit: item.frequency_unit,
        notes: item.notes || ''
      })
      setVehicle(vehicleRes.data)
    } catch (err) {
      setError('Failed to load maintenance item')
      console.error('Error loading item:', err)
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

    // Update frequency_unit when type changes
    if (name === 'maintenance_type') {
      setFormData(prev => ({
        ...prev,
        frequency_unit: value === 'mileage' ? 'miles' : 'days'
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await maintenanceItemAPI.update(itemId, {
        name: formData.name,
        maintenance_type: formData.maintenance_type,
        frequency_value: parseInt(formData.frequency_value),
        frequency_unit: formData.frequency_unit,
        notes: formData.notes || null
      })

      navigate(`/vehicle/${vehicleId}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update maintenance item')
      console.error('Error updating item:', err)
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (error && !formData.name) {
    return (
      <div className="edit-maintenance-item-page">
        <div className="error-alert">{error}</div>
        <Button onClick={() => navigate(`/vehicle/${vehicleId}`)}>Back to Vehicle</Button>
      </div>
    )
  }

  return (
    <div className="edit-maintenance-item-page">
      <div className="page-header">
        <div>
          <h2>Edit Maintenance Item</h2>
          {vehicle && (
            <p className="vehicle-name">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </p>
          )}
        </div>
        <Button variant="outline" onClick={() => navigate(`/vehicle/${vehicleId}`)}>
          Cancel
        </Button>
      </div>

      {error && (
        <div className="error-alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="edit-form">
        <div className="form-section">
          <h3>Item Details</h3>

          <Input
            label="Item Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Oil Change"
            required
          />

          <Select
            label="Maintenance Type"
            name="maintenance_type"
            value={formData.maintenance_type}
            onChange={handleChange}
            options={[
              { value: 'mileage', label: 'Mileage-based' },
              { value: 'time', label: 'Time-based' }
            ]}
            required
          />

          <div className="form-row-2col">
            <Input
              label="Frequency Value"
              name="frequency_value"
              type="number"
              value={formData.frequency_value}
              onChange={handleChange}
              placeholder="e.g., 5000"
              min="1"
              required
            />

            <Select
              label="Frequency Unit"
              name="frequency_unit"
              value={formData.frequency_unit}
              onChange={handleChange}
              options={formData.maintenance_type === 'mileage' ? [
                { value: 'miles', label: 'Miles' }
              ] : [
                { value: 'days', label: 'Days' },
                { value: 'months', label: 'Months' },
                { value: 'years', label: 'Years' }
              ]}
              required
            />
          </div>

          <TextArea
            label="Notes (Optional)"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="e.g., Full synthetic only, specific filter required..."
            rows={4}
          />
        </div>

        <div className="form-footer">
          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
            fullWidth
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default EditMaintenanceItem
