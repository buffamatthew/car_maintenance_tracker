# Setup Instructions

## Phase 1 & 2 Complete!

The project foundation has been set up with:
- Backend API with Flask + SQLAlchemy
- Database models for Vehicle, MaintenanceItem, and MaintenanceLog
- Frontend skeleton with React + Vite
- Docker configuration for easy deployment

## Next Steps to Run the Application

### 1. Start Docker

Make sure Docker Desktop is running on your machine.

### 2. Build and Start the Application

```bash
docker-compose up --build
```

This will:
- Build the backend and frontend Docker images
- Start both services
- Make the app accessible at:
  - Frontend: http://localhost:3000
  - Backend API: http://localhost:5001

### 3. Verify It's Working

Once containers are running, you can test the API:

```bash
# Get all vehicles (should return empty array initially)
curl http://localhost:5001/api/vehicles

# Create a test vehicle
curl -X POST http://localhost:5001/api/vehicles \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2020,
    "make": "Toyota",
    "model": "Camry",
    "engine_type": "2.5L 4-cylinder",
    "current_mileage": 25000
  }'
```

### 4. Stop the Application

```bash
docker-compose down
```

## What's Been Implemented

### Backend (Phase 1 & 2)
- ✅ Flask application structure
- ✅ SQLAlchemy database models:
  - Vehicle (year, make, model, engine_type, current_mileage)
  - MaintenanceItem (name, type, frequency, notes)
  - MaintenanceLog (date, mileage, notes, receipt_photo)
- ✅ REST API endpoints for all models (CRUD operations)
- ✅ File upload support for receipts
- ✅ Automatic mileage updates when logging maintenance

### Frontend (Phase 1 & 2)
- ✅ React application with Vite
- ✅ React Router setup
- ✅ API service layer (axios)
- ✅ Basic page components (Dashboard, AddVehicle, MaintenanceLog)
- ✅ Responsive CSS foundation

### Infrastructure (Phase 1 & 2)
- ✅ Docker setup for both services
- ✅ Docker Compose orchestration
- ✅ Development environment configuration
- ✅ Volume management for uploads

## Ready for Phase 3

The next phase will implement the "Add Vehicle" feature with:
- Vehicle creation form
- Maintenance item configuration
- Integration with the backend API

## Troubleshooting

### Docker Issues
- Make sure Docker Desktop is installed and running
- **Port 5000 Conflict (macOS)**: Port 5000 is used by macOS Control Center (AirPlay Receiver). The backend runs on port 5001 instead to avoid this conflict.
- If you see other port conflicts, you can modify the port mappings in `docker-compose.yml`

### Backend Issues
- Check logs: `docker-compose logs backend`
- Database is automatically created on first run

### Frontend Issues
- Check logs: `docker-compose logs frontend`
- Node modules are installed automatically in the container
