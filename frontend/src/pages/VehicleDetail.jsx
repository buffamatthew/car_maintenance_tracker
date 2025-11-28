import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import { vehicleAPI, maintenanceItemAPI, maintenanceLogAPI } from '../services/api'
import './VehicleDetail.css'

function VehicleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [vehicle, setVehicle] = useState(null)
  const [maintenanceItems, setMaintenanceItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadVehicleData()
  }, [id])

  const loadVehicleData = async () => {
    try {
      setLoading(true)

      // Load vehicle
      const vehicleResponse = await vehicleAPI.getById(id)
      setVehicle(vehicleResponse.data)

      // Load maintenance items for this vehicle
      const itemsResponse = await maintenanceItemAPI.getAll(id)
      const items = itemsResponse.data

      // Load logs for each maintenance item
      const itemsWithLogs = await Promise.all(
        items.map(async (item) => {
          const logsResponse = await maintenanceLogAPI.getAll(item.id)
          return {
            ...item,
            logs: logsResponse.data
          }
        })
      )

      setMaintenanceItems(itemsWithLogs)
    } catch (err) {
      setError('Failed to load vehicle details')
      console.error('Error loading vehicle:', err)
    } finally {
      setLoading(false)
    }
  }

  const getMaintenanceStatus = (item) => {
    if (!item.logs || item.logs.length === 0) {
      return {
        status: 'never',
        message: 'Never performed',
        daysRemaining: null,
        milesRemaining: null
      }
    }

    // Get most recent log
    const sortedLogs = [...item.logs].sort((a, b) =>
      new Date(b.date_performed) - new Date(a.date_performed)
    )
    const lastLog = sortedLogs[0]

    if (item.maintenance_type === 'mileage') {
      // Calculate miles remaining
      const lastMileage = lastLog.mileage || 0
      const nextMileage = lastMileage + item.frequency_value
      const milesRemaining = nextMileage - vehicle.current_mileage

      let status = 'good'
      if (milesRemaining <= 0) {
        status = 'overdue'
      } else if (milesRemaining <= item.frequency_value * 0.2) {
        status = 'due-soon'
      }

      return {
        status,
        message: `${milesRemaining > 0 ? milesRemaining : 0} miles remaining`,
        milesRemaining,
        nextMileage
      }
    } else {
      // Calculate days remaining
      const lastDate = new Date(lastLog.date_performed)
      const today = new Date()
      const daysSinceLast = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24))

      // Convert frequency to days
      let frequencyInDays = item.frequency_value
      if (item.frequency_unit === 'months') {
        frequencyInDays = item.frequency_value * 30
      } else if (item.frequency_unit === 'years') {
        frequencyInDays = item.frequency_value * 365
      }

      const daysRemaining = frequencyInDays - daysSinceLast

      let status = 'good'
      if (daysRemaining <= 0) {
        status = 'overdue'
      } else if (daysRemaining <= frequencyInDays * 0.2) {
        status = 'due-soon'
      }

      return {
        status,
        message: daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Overdue',
        daysRemaining,
        nextDate: new Date(lastDate.getTime() + frequencyInDays * 24 * 60 * 60 * 1000)
      }
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'good':
        return 'status-good'
      case 'due-soon':
        return 'status-due-soon'
      case 'overdue':
        return 'status-overdue'
      case 'never':
        return 'status-never'
      default:
        return ''
    }
  }

  const formatLastPerformed = (logs) => {
    if (!logs || logs.length === 0) {
      return 'Never'
    }

    const sortedLogs = [...logs].sort((a, b) =>
      new Date(b.date_performed) - new Date(a.date_performed)
    )
    const lastLog = sortedLogs[0]
    const date = new Date(lastLog.date_performed)

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return <div className="loading">Loading vehicle details...</div>
  }

  if (error || !vehicle) {
    return (
      <div className="vehicle-detail-page">
        <div className="error-alert">{error || 'Vehicle not found'}</div>
        <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
      </div>
    )
  }

  return (
    <div className="vehicle-detail-page">
      <div className="page-header">
        <div>
          <h2>{vehicle.year} {vehicle.make} {vehicle.model}</h2>
          {vehicle.engine_type && <p className="engine-type">{vehicle.engine_type}</p>}
        </div>
        <div className="header-actions">
          <Button variant="outline" onClick={() => navigate('/')}>
            Back to Dashboard
          </Button>
        </div>
      </div>

      <div className="vehicle-stats">
        <div className="stat-card">
          <div className="stat-label">Current Mileage</div>
          <div className="stat-value">{vehicle.current_mileage.toLocaleString()}</div>
          <div className="stat-unit">miles</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Maintenance Items</div>
          <div className="stat-value">{maintenanceItems.length}</div>
          <div className="stat-unit">tracked</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Items Due</div>
          <div className="stat-value">
            {maintenanceItems.filter(item => {
              const status = getMaintenanceStatus(item)
              return status.status === 'overdue' || status.status === 'due-soon'
            }).length}
          </div>
          <div className="stat-unit">need attention</div>
        </div>
      </div>

      <div className="maintenance-section">
        <div className="section-header">
          <h3>Maintenance Items</h3>
          <Button onClick={() => navigate('/maintenance-log', { state: { vehicleId: vehicle.id } })}>
            + Log Maintenance
          </Button>
        </div>

        {maintenanceItems.length === 0 ? (
          <div className="empty-state">
            <p>No maintenance items configured for this vehicle.</p>
            <p className="empty-hint">Edit vehicle functionality coming soon!</p>
          </div>
        ) : (
          <div className="maintenance-items">
            {maintenanceItems.map((item) => {
              const status = getMaintenanceStatus(item)
              return (
                <div key={item.id} className={`maintenance-card ${getStatusColor(status.status)}`}>
                  <div className="card-header">
                    <h4>{item.name}</h4>
                    <span className={`status-badge ${getStatusColor(status.status)}`}>
                      {status.status === 'never' && 'Not Done'}
                      {status.status === 'good' && 'Good'}
                      {status.status === 'due-soon' && 'Due Soon'}
                      {status.status === 'overdue' && 'Overdue'}
                    </span>
                  </div>

                  <div className="card-body">
                    <div className="info-row">
                      <span className="label">Frequency:</span>
                      <span>Every {item.frequency_value} {item.frequency_unit}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Last Performed:</span>
                      <span>{formatLastPerformed(item.logs)}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Status:</span>
                      <span className="status-message">{status.message}</span>
                    </div>
                    {item.notes && (
                      <div className="info-row notes">
                        <span className="label">Notes:</span>
                        <span>{item.notes}</span>
                      </div>
                    )}
                  </div>

                  <div className="card-footer">
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/vehicle/${vehicle.id}/item/${item.id}/history`)}
                    >
                      View History
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => navigate('/maintenance-log', {
                        state: { vehicleId: vehicle.id, itemId: item.id }
                      })}
                    >
                      Log Maintenance
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default VehicleDetail
