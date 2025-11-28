import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import AddVehicle from './pages/AddVehicle'
import EditVehicle from './pages/EditVehicle'
import VehicleDetail from './pages/VehicleDetail'
import AddMaintenanceItem from './pages/AddMaintenanceItem'
import EditMaintenanceItem from './pages/EditMaintenanceItem'
import MaintenanceLog from './pages/MaintenanceLog'
import MaintenanceHistory from './pages/MaintenanceHistory'
import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>Car Maintenance Tracker</h1>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add-vehicle" element={<AddVehicle />} />
            <Route path="/vehicle/:id" element={<VehicleDetail />} />
            <Route path="/vehicle/:id/edit" element={<EditVehicle />} />
            <Route path="/vehicle/:vehicleId/add-item" element={<AddMaintenanceItem />} />
            <Route path="/vehicle/:vehicleId/item/:itemId/edit" element={<EditMaintenanceItem />} />
            <Route path="/vehicle/:vehicleId/item/:itemId/history" element={<MaintenanceHistory />} />
            <Route path="/maintenance-log" element={<MaintenanceLog />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
