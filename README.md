# Car Maintenance Tracker

A Docker-based web application for tracking vehicle maintenance, accessible on mobile and desktop browsers.

## Quick Start

### Development

```bash
# Start the application
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5001
```

That's it! Open http://localhost:3000 in your browser.

### Production Deployment

For deploying to a server (Proxmox VM, VPS, etc.), see **[DEPLOYMENT.md](DEPLOYMENT.md)** for complete instructions.

Quick deployment:
```bash
./deploy.sh
```

## What's Working Now

### ✅ Add Vehicles
- Add vehicles with year, make, model, engine type, and current mileage
- Add multiple maintenance items per vehicle:
  - **Mileage-based** (e.g., "Oil change every 5000 miles")
  - **Time-based** (e.g., "Battery every 3 years")
  - Optional notes for part numbers and specifications

### ✅ View Vehicles
- Dashboard showing all your vehicles
- See current mileage for each vehicle

### ✅ Dashboard & Tracking
- Visual dashboard showing all vehicles
- Top 3 urgent maintenance items per vehicle with progress bars
- Color-coded status (overdue, due soon, good)
- Track both scheduled and general maintenance
- Multiple file attachments (photos, PDFs, documents)
- Cost tracking for all maintenance
- Export/import for data backup

### ✅ Maintenance Features
- Log scheduled maintenance (oil changes, tire rotations, etc.)
- Log general maintenance (one-off repairs, upgrades)
- Complete maintenance history with editing
- File attachments (up to 5 per log, 16MB each)
- Automatic status calculation based on mileage or time

## Tech Stack

- **Backend:** Python/Flask, SQLAlchemy, SQLite
- **Frontend:** React, Vite, React Router
- **Infrastructure:** Docker & Docker Compose

## Development

### Running Tests

```bash
# Automated unit tests
docker-compose exec backend pytest -v

# Manual API testing
./test_api.sh
```

### Common Commands

```bash
# View logs
docker-compose logs backend --tail 50
docker-compose logs frontend --tail 50

# Restart a service
docker-compose restart frontend

# Stop everything
docker-compose down
```

### Port Conflict on macOS

Port 5000 is used by macOS Control Center (AirPlay). The backend runs on **port 5001** instead.

## Project Structure

```
├── backend/          # Flask API + SQLAlchemy models
├── frontend/         # React application
├── docker-compose.yml
├── PROJECT_STATUS.md # Detailed project status and progress
└── README.md         # This file
```

## Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide for Proxmox/VPS
- **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - Complete project status, phases, API docs, next steps
- **SETUP.md** - Detailed setup and troubleshooting (development)
- **TESTING.md** - Testing guide with examples

## API Endpoints

### Vehicles
- `GET /api/vehicles` - List all vehicles
- `POST /api/vehicles` - Create vehicle
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle

### Maintenance Items
- `GET /api/maintenance-items?vehicle_id=:id` - List items
- `POST /api/maintenance-items` - Create item

### Maintenance Logs
- `GET /api/maintenance-logs?maintenance_item_id=:id` - List logs
- `POST /api/maintenance-logs` - Create log (with photo upload)

See PROJECT_STATUS.md for complete API documentation.

## License

MIT
