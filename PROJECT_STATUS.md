# Car Maintenance Tracker - Project Status

**Last Updated:** 2025-11-27

## Project Overview

A Docker-based web application for tracking vehicle maintenance, accessible on mobile and desktop browsers. Users can manage multiple vehicles, track maintenance items (mileage-based and time-based), and log maintenance activities.

## Tech Stack

**Backend:**
- Python 3.11
- Flask 3.0.0
- SQLAlchemy (SQLite database)
- Flask-CORS
- Flask-Migrate

**Frontend:**
- React 18
- Vite 5
- React Router 6
- Axios
- Custom CSS (no framework)

**Infrastructure:**
- Docker & Docker Compose
- Backend: Port 5001 (mapped from 5000 internally)
- Frontend: Port 3000

## Current Status

### ✅ Completed Phases

#### Phase 1 & 2: Project Setup & Database Models (COMPLETE)
- [x] Project structure created
- [x] Docker configuration (docker-compose.yml, Dockerfiles)
- [x] Backend Flask application with SQLAlchemy
- [x] Database models:
  - Vehicle (year, make, model, engine_type, current_mileage)
  - MaintenanceItem (name, maintenance_type, frequency_value, frequency_unit, notes)
  - MaintenanceLog (date_performed, mileage, notes, receipt_photo)
- [x] REST API endpoints (CRUD for all models)
- [x] File upload support for receipts
- [x] Automated tests (pytest) - 17 test cases
- [x] Manual test script (test_api.sh)

**Files:**
- Backend: `backend/app/`, `backend/tests/`, `backend/requirements.txt`
- Docs: `README.md`, `SETUP.md`, `TESTING.md`

#### Phase 3: Add Vehicle Feature (COMPLETE)
- [x] Reusable UI components:
  - Button (primary, secondary, outline, danger variants)
  - Input (with validation)
  - Select (dropdown)
  - TextArea
- [x] MaintenanceItemForm component
  - Support for mileage-based items (miles)
  - Support for time-based items (days, months, years)
  - Notes field for specifications
- [x] AddVehicle page
  - Vehicle information form
  - Add multiple maintenance items
  - Preview and remove items
  - Form validation
  - Error handling
- [x] Enhanced Dashboard
  - List all vehicles as cards
  - Empty state
  - Navigation to Add Vehicle
  - Placeholder "View Details" button
- [x] Full API integration
- [x] Mobile-responsive design
- [x] **Bug Fix:** MaintenanceItemForm changed from `<form>` to `<div>` to prevent nested form submission issue

**Files:**
- Components: `frontend/src/components/` (Button, Input, Select, TextArea, MaintenanceItemForm)
- Pages: `frontend/src/pages/Dashboard.jsx`, `frontend/src/pages/AddVehicle.jsx`
- API: `frontend/src/services/api.js`
- Docs: `PHASE3_COMPLETE.md`

### 🚧 In Progress

None currently - Phase 3 just completed!

### 📋 Planned Phases

#### Phase 4: Dashboard Core Features (NEXT)
- [ ] Vehicle selector dropdown
- [ ] Display maintenance items for selected vehicle
- [ ] Show current mileage for selected vehicle
- [ ] Calculate time/mileage remaining for each item
- [ ] Basic status display (green/yellow/red indicators)

#### Phase 5: Dashboard Visualizations
- [ ] Gauge/chart components for individual maintenance items
- [ ] Visual representation of maintenance status
- [ ] Overview display for all vehicles
- [ ] Color coding for urgency (green/yellow/red)

#### Phase 6: Maintenance Log Feature
- [ ] Maintenance log form UI
- [ ] Select maintenance item from dropdown
- [ ] Log date, mileage, notes
- [ ] Photo receipt upload
- [ ] Auto-update vehicle mileage
- [ ] Reset gauges after logging

#### Phase 7: Settings & User Management (Basic)
- [ ] User authentication (login/register)
- [ ] User-vehicle associations
- [ ] Settings page UI
- [ ] User management

#### Phase 8: Nice-to-Have Features
- [ ] Email notifications when maintenance is due
- [ ] Mileage tracking integration
- [ ] Export/import functionality
- [ ] Backup/restore features

## Known Issues

### Fixed
- ✅ Port 5000 conflict on macOS (moved to 5001)
- ✅ MaintenanceItemForm nested form issue (changed to div)

### Open
None currently

## How to Run

```bash
# Start application
docker-compose up --build

# Access
Frontend: http://localhost:3000
Backend API: http://localhost:5001

# Run tests
docker-compose exec backend pytest -v

# Stop application
docker-compose down
```

## Quick Commands

```bash
# View logs
docker-compose logs backend --tail 50
docker-compose logs frontend --tail 50

# Restart a service
docker-compose restart frontend
docker-compose restart backend

# Execute commands in container
docker-compose exec backend bash
docker-compose exec frontend sh

# Test API manually
./test_api.sh
```

## Database Schema

### Vehicle
- id (PK)
- year, make, model, engine_type
- current_mileage
- created_at, updated_at
- **Relationships:** Has many MaintenanceItems (cascade delete)

### MaintenanceItem
- id (PK)
- vehicle_id (FK)
- name, maintenance_type (mileage/time)
- frequency_value, frequency_unit
- notes
- created_at, updated_at
- **Relationships:** Belongs to Vehicle, Has many MaintenanceLogs (cascade delete)

### MaintenanceLog
- id (PK)
- maintenance_item_id (FK)
- date_performed, mileage
- notes, receipt_photo (file path)
- created_at
- **Relationships:** Belongs to MaintenanceItem

## API Endpoints

### Vehicles
- `GET /api/vehicles` - List all
- `GET /api/vehicles/:id` - Get one
- `POST /api/vehicles` - Create
- `PUT /api/vehicles/:id` - Update
- `DELETE /api/vehicles/:id` - Delete

### Maintenance Items
- `GET /api/maintenance-items?vehicle_id=:id` - List for vehicle
- `GET /api/maintenance-items/:id` - Get one
- `POST /api/maintenance-items` - Create
- `PUT /api/maintenance-items/:id` - Update
- `DELETE /api/maintenance-items/:id` - Delete

### Maintenance Logs
- `GET /api/maintenance-logs?maintenance_item_id=:id` - List for item
- `GET /api/maintenance-logs/:id` - Get one
- `POST /api/maintenance-logs` - Create (supports file upload)
- `DELETE /api/maintenance-logs/:id` - Delete

## Project Structure

```
car_maintenance_tracker/
├── backend/
│   ├── app/
│   │   ├── models/          # Vehicle, MaintenanceItem, MaintenanceLog
│   │   ├── routes/          # API blueprints
│   │   └── __init__.py      # Flask app factory
│   ├── tests/               # pytest test suite
│   ├── config.py
│   ├── run.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Dashboard, AddVehicle, MaintenanceLog
│   │   ├── services/       # API client (axios)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── docker-compose.yml
├── test_api.sh
├── .gitignore
├── README.md
├── SETUP.md
├── TESTING.md
├── PHASE3_COMPLETE.md
└── PROJECT_STATUS.md (this file)
```

## Development Notes

### Frontend Hot Reload
- Vite provides HMR (Hot Module Reload)
- Changes to .jsx, .css files auto-reload
- Sometimes requires hard refresh (Ctrl+Shift+R)
- Restart frontend if needed: `docker-compose restart frontend`

### Backend Auto-Reload
- Flask debug mode enabled
- Changes to .py files auto-reload
- Database persists in SQLite file

### Design Decisions
- **Port 5001:** Avoids macOS AirPlay conflict on 5000
- **SQLite:** Simple file-based DB, good for local deployment
- **No CSS Framework:** Custom CSS for full control and learning
- **Nested Forms:** Avoided by using div instead of form for MaintenanceItemForm

## Next Session TODO

When resuming work:
1. Review this PROJECT_STATUS.md file
2. Check if containers are running: `docker-compose ps`
3. Start if needed: `docker-compose up -d`
4. Decide on next phase (recommend Phase 4: Dashboard Core Features)
5. Update this file as work progresses

## Questions to Consider for Phase 4

- How should we calculate when maintenance is due?
  - For mileage: `(last_log_mileage + frequency) - current_mileage`
  - For time: Days since last log vs frequency
- Should we create a new API endpoint for "maintenance status"?
- What data structure should we return for the dashboard?
- How do we handle items that have never been logged?

## Resources

- Flask Documentation: https://flask.palletsprojects.com/
- React Documentation: https://react.dev/
- SQLAlchemy Documentation: https://docs.sqlalchemy.org/
- Vite Documentation: https://vitejs.dev/
