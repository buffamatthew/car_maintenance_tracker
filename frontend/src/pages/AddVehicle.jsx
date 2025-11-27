import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Input from '../components/Input'
import Button from '../components/Button'
import MaintenanceItemForm from '../components/MaintenanceItemForm'
import { vehicleAPI, maintenanceItemAPI } from '../services/api'
import './AddVehicle.css'

function AddVehicle() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false)

  const [vehicleData, setVehicleData] = useState({
    year: '',
    make: '',
    model: '',
    engine_type: '',
    current_mileage: ''
  })

  const [maintenanceItems, setMaintenanceItems] = useState([])

  const handleVehicleChange = (e) => {
    const { name, value } = e.target
    setVehicleData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAddMaintenanceItem = (item) => {
    setMaintenanceItems(prev => [...prev, item])
    // Keep form open so user can add more items
  }

  const handleRemoveMaintenanceItem = (index) => {
    setMaintenanceItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Create vehicle
      const vehiclePayload = {
        year: parseInt(vehicleData.year),
        make: vehicleData.make,
        model: vehicleData.model,
        engine_type: vehicleData.engine_type || undefined,
        current_mileage: vehicleData.current_mileage ? parseInt(vehicleData.current_mileage) : 0
      }

      const vehicleResponse = await vehicleAPI.create(vehiclePayload)
      const vehicleId = vehicleResponse.data.id

      // Create maintenance items
      for (const item of maintenanceItems) {
        await maintenanceItemAPI.create({
          ...item,
          vehicle_id: vehicleId
        })
      }

      // Navigate to dashboard
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create vehicle')
      console.error('Error creating vehicle:', err)
    } finally {
      setLoading(false)
    }
  }

  const currentYear = new Date().getFullYear()

  return (
    <div className="add-vehicle-page">
      <div className="page-header">
        <h2>Add New Vehicle</h2>
        <Button variant="outline" onClick={() => navigate('/')}>
          Back to Dashboard
        </Button>
      </div>

      {error && (
        <div className="error-alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="add-vehicle-form">
        <section className="form-section">
          <h3>Vehicle Information</h3>

          <div className="form-grid">
            <Input
              label="Year"
              name="year"
              type="number"
              value={vehicleData.year}
              onChange={handleVehicleChange}
              placeholder="e.g., 2020"
              min="1900"
              max={currentYear + 1}
              required
            />

            <Input
              label="Make"
              name="make"
              value={vehicleData.make}
              onChange={handleVehicleChange}
              placeholder="e.g., Toyota"
              required
            />

            <Input
              label="Model"
              name="model"
              value={vehicleData.model}
              onChange={handleVehicleChange}
              placeholder="e.g., Camry"
              required
            />

            <Input
              label="Engine Type"
              name="engine_type"
              value={vehicleData.engine_type}
              onChange={handleVehicleChange}
              placeholder="e.g., 2.5L 4-cylinder"
            />

            <Input
              label="Current Mileage"
              name="current_mileage"
              type="number"
              value={vehicleData.current_mileage}
              onChange={handleVehicleChange}
              placeholder="e.g., 25000"
              min="0"
            />
          </div>
        </section>

        <section className="form-section">
          <div className="section-header">
            <h3>Maintenance Items</h3>
            <p className="section-description">
              Add maintenance items to track for this vehicle
            </p>
          </div>

          {maintenanceItems.length > 0 && (
            <div className="maintenance-items-list">
              {maintenanceItems.map((item, index) => (
                <div key={index} className="maintenance-item-card">
                  <div className="item-info">
                    <h4>{item.name}</h4>
                    <p className="item-frequency">
                      Every {item.frequency_value} {item.frequency_unit}
                      {' '}({item.maintenance_type === 'mileage' ? 'Mileage' : 'Time'}-based)
                    </p>
                    {item.notes && <p className="item-notes">{item.notes}</p>}
                  </div>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => handleRemoveMaintenanceItem(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}

          {showMaintenanceForm ? (
            <MaintenanceItemForm
              onAdd={handleAddMaintenanceItem}
              onCancel={() => setShowMaintenanceForm(false)}
            />
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowMaintenanceForm(true)}
            >
              + Add Maintenance Item
            </Button>
          )}
        </section>

        <div className="form-footer">
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            fullWidth
          >
            {loading ? 'Creating Vehicle...' : 'Create Vehicle'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default AddVehicle
