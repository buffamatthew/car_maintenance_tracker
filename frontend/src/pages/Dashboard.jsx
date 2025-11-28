import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import ProgressBar from '../components/ProgressBar'
import { vehicleAPI, maintenanceItemAPI, maintenanceLogAPI } from '../services/api'
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
      const vehiclesResponse = await vehicleAPI.getAll()
      const vehiclesData = vehiclesResponse.data

      // Load maintenance items and logs for each vehicle to calculate health
      const vehiclesWithHealth = await Promise.all(
        vehiclesData.map(async (vehicle) => {
          try {
            const itemsResponse = await maintenanceItemAPI.getAll(vehicle.id)
            const items = itemsResponse.data

            // Load logs for each maintenance item
            const itemsWithLogs = await Promise.all(
              items.map(async (item) => {
                try {
                  const logsResponse = await maintenanceLogAPI.getAll(item.id)
                  return {
                    ...item,
                    logs: logsResponse.data
                  }
                } catch (err) {
                  return { ...item, logs: [] }
                }
              })
            )

            // Calculate health score and get top urgent items
            const health = calculateVehicleHealth(vehicle, itemsWithLogs)
            const topUrgentItems = getTopUrgentItems(vehicle, itemsWithLogs, 3)

            return {
              ...vehicle,
              maintenanceItems: itemsWithLogs,
              health,
              topUrgentItems
            }
          } catch (err) {
            return {
              ...vehicle,
              maintenanceItems: [],
              health: { score: 100, status: 'good', itemsDue: 0 },
              topUrgentItems: []
            }
          }
        })
      )

      setVehicles(vehiclesWithHealth)
    } catch (err) {
      setError('Failed to load vehicles')
      console.error('Error loading vehicles:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateVehicleHealth = (vehicle, items) => {
    if (items.length === 0) {
      return { score: 100, status: 'good', itemsDue: 0 }
    }

    let totalPercentage = 0
    let itemsDue = 0
    let itemsOverdue = 0

    items.forEach(item => {
      const status = getItemStatus(vehicle, item)
      totalPercentage += status.percentageRemaining

      if (status.status === 'overdue') {
        itemsOverdue++
        itemsDue++
      } else if (status.status === 'due-soon') {
        itemsDue++
      }
    })

    const avgPercentage = totalPercentage / items.length
    let overallStatus = 'good'

    if (itemsOverdue > 0) {
      overallStatus = 'overdue'
    } else if (itemsDue > 0) {
      overallStatus = 'due-soon'
    } else if (avgPercentage < 50) {
      overallStatus = 'due-soon'
    }

    return {
      score: Math.round(avgPercentage),
      status: overallStatus,
      itemsDue,
      itemsOverdue
    }
  }

  const getTopUrgentItems = (vehicle, items, count = 3) => {
    // Get all items with their status
    const itemsWithStatus = items.map(item => ({
      ...item,
      statusInfo: getItemStatus(vehicle, item)
    }))

    // Sort by percentage remaining (lowest first = most urgent)
    // Items with 'never' status (0%) should be at the end
    const sorted = itemsWithStatus.sort((a, b) => {
      // If one has never been done, put it at the end
      if (a.statusInfo.status === 'never' && b.statusInfo.status !== 'never') return 1
      if (b.statusInfo.status === 'never' && a.statusInfo.status !== 'never') return -1

      // Otherwise sort by percentage (lower = more urgent)
      return a.statusInfo.percentageRemaining - b.statusInfo.percentageRemaining
    })

    // Return top N items
    return sorted.slice(0, count)
  }

  const getItemStatus = (vehicle, item) => {
    if (!item.logs || item.logs.length === 0) {
      return {
        status: 'never',
        percentageRemaining: 0
      }
    }

    const sortedLogs = [...item.logs].sort((a, b) =>
      new Date(b.date_performed) - new Date(a.date_performed)
    )
    const lastLog = sortedLogs[0]

    if (item.maintenance_type === 'mileage') {
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

      return { status, percentageRemaining }
    } else {
      const lastDate = new Date(lastLog.date_performed)
      const today = new Date()
      const daysSinceLast = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24))

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

      return { status, percentageRemaining }
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
                <div className="vehicle-title">
                  <h3>{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                  {vehicle.health && vehicle.health.itemsDue > 0 && (
                    <span className={`health-badge health-${vehicle.health.status}`}>
                      {vehicle.health.itemsOverdue > 0 ? `${vehicle.health.itemsOverdue} Overdue` : `${vehicle.health.itemsDue} Due Soon`}
                    </span>
                  )}
                </div>
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
                {vehicle.maintenanceItems && (
                  <p className="detail-item">
                    <span className="detail-label">Items Tracked:</span> {vehicle.maintenanceItems.length}
                  </p>
                )}
              </div>

              {vehicle.topUrgentItems && vehicle.topUrgentItems.length > 0 && (
                <div className="urgent-items">
                  <h4 className="urgent-items-title">Upcoming Maintenance</h4>
                  <div className="urgent-items-list">
                    {vehicle.topUrgentItems.map((item) => (
                      <div key={item.id} className="urgent-item">
                        <div className="urgent-item-header">
                          <span className="urgent-item-name">{item.name}</span>
                          <span className={`urgent-item-status status-${item.statusInfo.status}`}>
                            {item.statusInfo.status === 'overdue' && 'Overdue'}
                            {item.statusInfo.status === 'due-soon' && 'Due Soon'}
                            {item.statusInfo.status === 'good' && 'Good'}
                            {item.statusInfo.status === 'never' && 'Not Done'}
                          </span>
                        </div>
                        <ProgressBar
                          percentage={item.statusInfo.percentageRemaining}
                          status={item.statusInfo.status}
                          showLabel={false}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
