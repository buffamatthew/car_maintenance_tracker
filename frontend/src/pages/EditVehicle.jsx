import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Input from '../components/Input'
import Button from '../components/Button'
import { vehicleAPI } from '../services/api'
import './EditVehicle.css'

function EditVehicle() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const [formData, setFormData] = useState({
    year: '',
    make: '',
    model: '',
    engine_type: '',
    current_mileage: ''
  })

  useEffect(() => {
    loadVehicle()
  }, [id])

  const loadVehicle = async () => {
    try {
      setLoading(true)
      const response = await vehicleAPI.getById(id)
      const vehicle = response.data
      setFormData({
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        engine_type: vehicle.engine_type || '',
        current_mileage: vehicle.current_mileage
      })
    } catch (err) {
      setError('Failed to load vehicle')
      console.error('Error loading vehicle:', err)
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
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await vehicleAPI.update(id, {
        year: parseInt(formData.year),
        make: formData.make,
        model: formData.model,
        engine_type: formData.engine_type || null,
        current_mileage: parseInt(formData.current_mileage)
      })

      navigate(`/vehicle/${id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update vehicle')
      console.error('Error updating vehicle:', err)
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading vehicle...</div>
  }

  if (error && !formData.year) {
    return (
      <div className="edit-vehicle-page">
        <div className="error-alert">{error}</div>
        <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
      </div>
    )
  }

  return (
    <div className="edit-vehicle-page">
      <div className="page-header">
        <h2>Edit Vehicle</h2>
        <Button variant="outline" onClick={() => navigate(`/vehicle/${id}`)}>
          Cancel
        </Button>
      </div>

      {error && (
        <div className="error-alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="edit-vehicle-form">
        <div className="form-section">
          <h3>Vehicle Information</h3>

          <Input
            label="Year"
            name="year"
            type="number"
            value={formData.year}
            onChange={handleChange}
            placeholder="e.g., 2020"
            min="1900"
            max={new Date().getFullYear() + 1}
            required
          />

          <Input
            label="Make"
            name="make"
            type="text"
            value={formData.make}
            onChange={handleChange}
            placeholder="e.g., Toyota"
            required
          />

          <Input
            label="Model"
            name="model"
            type="text"
            value={formData.model}
            onChange={handleChange}
            placeholder="e.g., Camry"
            required
          />

          <Input
            label="Engine Type (Optional)"
            name="engine_type"
            type="text"
            value={formData.engine_type}
            onChange={handleChange}
            placeholder="e.g., 2.5L 4-Cylinder"
          />

          <Input
            label="Current Mileage"
            name="current_mileage"
            type="number"
            value={formData.current_mileage}
            onChange={handleChange}
            placeholder="e.g., 45000"
            min="0"
            required
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

export default EditVehicle
