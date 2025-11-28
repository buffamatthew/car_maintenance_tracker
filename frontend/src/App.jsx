import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import AddVehicle from './pages/AddVehicle'
import VehicleDetail from './pages/VehicleDetail'
import MaintenanceLog from './pages/MaintenanceLog'
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
            <Route path="/maintenance-log" element={<MaintenanceLog />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
