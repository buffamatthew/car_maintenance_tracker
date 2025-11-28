import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import MaintenanceItemForm from '../components/MaintenanceItemForm'
import { vehicleAPI, maintenanceItemAPI } from '../services/api'
import './AddMaintenanceItem.css'

function AddMaintenanceItem() {
  const { vehicleId } = useParams()
  const navigate = useNavigate()

  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadVehicle()
  }, [vehicleId])

  const loadVehicle = async () => {
    try {
      setLoading(true)
      const response = await vehicleAPI.getById(vehicleId)
      setVehicle(response.data)
    } catch (err) {
      setError('Failed to load vehicle')
      console.error('Error loading vehicle:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = async (item) => {
    setSubmitting(true)
    setError(null)

    try {
      await maintenanceItemAPI.create({
        ...item,
        vehicle_id: parseInt(vehicleId)
      })

      navigate(`/vehicle/${vehicleId}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add maintenance item')
      console.error('Error adding maintenance item:', err)
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (error && !vehicle) {
    return (
      <div className="add-maintenance-item-page">
        <div className="error-alert">{error}</div>
        <Button onClick={() => navigate(`/vehicle/${vehicleId}`)}>Back to Vehicle</Button>
      </div>
    )
  }

  return (
    <div className="add-maintenance-item-page">
      <div className="page-header">
        <div>
          <h2>Add Maintenance Item</h2>
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

      <div className="form-container">
        <MaintenanceItemForm onAdd={handleAddItem} />
      </div>
    </div>
  )
}

export default AddMaintenanceItem
