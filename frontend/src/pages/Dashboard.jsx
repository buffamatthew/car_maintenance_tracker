import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import { vehicleAPI } from '../services/api'
import './Dashboard.css'

function Dashboard() {
  const navigate = useNavigate()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadVehicles()
  }, [])

  const loadVehicles = async () => {
    try {
      setLoading(true)
      const response = await vehicleAPI.getAll()
      setVehicles(response.data)
    } catch (err) {
      setError('Failed to load vehicles')
      console.error('Error loading vehicles:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h2>Dashboard</h2>
        <Button onClick={() => navigate('/add-vehicle')}>
          + Add Vehicle
        </Button>
      </div>

      {error && (
        <div className="error-alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading vehicles...</div>
      ) : vehicles.length === 0 ? (
        <div className="empty-state">
          <h3>No vehicles yet</h3>
          <p>Get started by adding your first vehicle to track maintenance.</p>
          <Button onClick={() => navigate('/add-vehicle')}>
            Add Your First Vehicle
          </Button>
        </div>
      ) : (
        <div className="vehicles-grid">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="vehicle-card">
              <div className="vehicle-header">
                <h3>{vehicle.year} {vehicle.make} {vehicle.model}</h3>
              </div>
              <div className="vehicle-details">
                {vehicle.engine_type && (
                  <p className="detail-item">
                    <span className="detail-label">Engine:</span> {vehicle.engine_type}
                  </p>
                )}
                <p className="detail-item">
                  <span className="detail-label">Mileage:</span> {vehicle.current_mileage.toLocaleString()} miles
                </p>
              </div>
              <div className="vehicle-actions">
                <Button variant="outline" onClick={() => navigate(`/vehicle/${vehicle.id}`)}>
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Dashboard
