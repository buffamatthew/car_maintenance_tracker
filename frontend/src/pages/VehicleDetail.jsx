import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import ProgressBar from '../components/ProgressBar'
import CircularProgress from '../components/CircularProgress'
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

  const handleDeleteVehicle = async () => {
    if (!window.confirm(`Are you sure you want to delete this vehicle? This will also delete all maintenance items and logs for this vehicle.`)) {
      return
    }

    try {
      await vehicleAPI.delete(id)
      navigate('/')
    } catch (err) {
      setError('Failed to delete vehicle')
      console.error('Error deleting vehicle:', err)
    }
  }

  const handleDeleteItem = async (itemId, itemName) => {
    if (!window.confirm(`Are you sure you want to delete "${itemName}"? This will also delete all logs for this maintenance item.`)) {
      return
    }

    try {
      await maintenanceItemAPI.delete(itemId)
      // Remove from local state
      setMaintenanceItems(maintenanceItems.filter(item => item.id !== itemId))
    } catch (err) {
      setError('Failed to delete maintenance item')
      console.error('Error deleting maintenance item:', err)
    }
  }

  const getMaintenanceStatus = (item) => {
    if (!item.logs || item.logs.length === 0) {
      return {
        status: 'never',
        message: 'Never performed',
        daysRemaining: null,
        milesRemaining: null,
        percentageRemaining: 0
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
      const percentageRemaining = Math.max(0, (milesRemaining / item.frequency_value) * 100)

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
        nextMileage,
        percentageRemaining
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
      const percentageRemaining = Math.max(0, (daysRemaining / frequencyInDays) * 100)

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
        nextDate: new Date(lastDate.getTime() + frequencyInDays * 24 * 60 * 60 * 1000),
        percentageRemaining
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
          <Button onClick={() => navigate(`/vehicle/${id}/edit`)}>
            Edit Vehicle
          </Button>
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
          <div className="section-actions">
            <Button variant="outline" onClick={() => navigate(`/vehicle/${vehicle.id}/add-item`)}>
              + Add Item
            </Button>
            <Button onClick={() => navigate('/maintenance-log', { state: { vehicleId: vehicle.id } })}>
              + Log Maintenance
            </Button>
          </div>
        </div>

        {maintenanceItems.length === 0 ? (
          <div className="empty-state">
            <p>No maintenance items configured for this vehicle.</p>
            <p className="empty-hint">Click "+ Add Item" to get started!</p>
          </div>
        ) : (
          <div className="maintenance-items">
            {maintenanceItems.map((item) => {
              const status = getMaintenanceStatus(item)
              return (
                <div key={item.id} className={`maintenance-card ${getStatusColor(status.status)}`}>
                  <div className="card-header">
                    <div className="card-header-left">
                      <h4>{item.name}</h4>
                      <span className={`status-badge ${getStatusColor(status.status)}`}>
                        {status.status === 'never' && 'Not Done'}
                        {status.status === 'good' && 'Good'}
                        {status.status === 'due-soon' && 'Due Soon'}
                        {status.status === 'overdue' && 'Overdue'}
                      </span>
                    </div>
                    <CircularProgress
                      percentage={status.percentageRemaining}
                      status={status.status}
                      size={70}
                      strokeWidth={6}
                    />
                  </div>

                  <div className="card-body">
                    <div className="progress-section">
                      <ProgressBar
                        percentage={status.percentageRemaining}
                        status={status.status}
                        showLabel={false}
                      />
                    </div>
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
                    <div className="card-footer-row">
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
                    <div className="card-footer-row">
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/vehicle/${vehicle.id}/item/${item.id}/edit`)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleDeleteItem(item.id, item.name)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="danger-zone">
        <h3>Danger Zone</h3>
        <p>Deleting this vehicle will also delete all associated maintenance items and logs. This action cannot be undone.</p>
        <Button variant="danger" onClick={handleDeleteVehicle}>
          Delete Vehicle
        </Button>
      </div>
    </div>
  )
}

export default VehicleDetail
