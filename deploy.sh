#!/bin/bash

# Car Maintenance Tracker - Deployment Script
# This script handles deployment and updates

set -e  # Exit on error

echo "========================================="
echo "Car Maintenance Tracker - Deployment"
echo "========================================="
echo ""

# Determine which docker compose command to use
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Function to check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed. Please install Docker first."
        exit 1
    fi

    echo "✅ Docker and Docker Compose are installed (using: $DOCKER_COMPOSE)"
}

# Function to pull latest changes
pull_changes() {
    echo ""
    echo "📥 Pulling latest changes from git..."
    if [ -d ".git" ]; then
        git pull
        echo "✅ Code updated"
    else
        echo "⚠️  Not a git repository - skipping git pull"
    fi
}

# Function to stop running containers
stop_containers() {
    echo ""
    echo "🛑 Stopping existing containers..."
    $DOCKER_COMPOSE -f docker-compose.prod.yml down
    echo "✅ Containers stopped"
}

# Function to build and start containers
start_containers() {
    echo ""
    echo "🔨 Building and starting containers..."
    $DOCKER_COMPOSE -f docker-compose.prod.yml up -d --build
    echo "✅ Containers started"
}

# Function to show container status
show_status() {
    echo ""
    echo "📊 Container Status:"
    $DOCKER_COMPOSE -f docker-compose.prod.yml ps
}

# Function to show logs
show_logs() {
    echo ""
    echo "📝 Recent logs:"
    $DOCKER_COMPOSE -f docker-compose.prod.yml logs --tail=20
}

# Function to backup database
backup_db() {
    echo ""
    echo "💾 Creating database backup..."
    BACKUP_DIR="./backups"
    mkdir -p "$BACKUP_DIR"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)

    # Try to backup from volume (check both old and new locations)
    docker run --rm \
        -v car_maintenance_tracker_db-data:/data \
        -v "$(pwd)/$BACKUP_DIR:/backup" \
        alpine \
        sh -c "if [ -f /data/car_maintenance.db ]; then cp /data/car_maintenance.db /backup/car_maintenance_$TIMESTAMP.db && echo '✅ Database backed up to $BACKUP_DIR/car_maintenance_$TIMESTAMP.db'; elif [ -f /data/car_maintenance.db ]; then cp /data/car_maintenance.db /backup/car_maintenance_$TIMESTAMP.db && echo '✅ Database backed up to $BACKUP_DIR/car_maintenance_$TIMESTAMP.db'; else echo '⚠️  No database found to backup'; fi"
}

# Function to migrate database from old volume structure to new
migrate_db_volume() {
    echo ""
    echo "🔄 Checking if database migration is needed..."

    # Check if old volume has database at root (old structure: db-data:/app)
    OLD_DB_EXISTS=$(docker run --rm -v car_maintenance_tracker_db-data:/data alpine sh -c "[ -f /data/car_maintenance.db ] && echo 'yes' || echo 'no'")

    if [ "$OLD_DB_EXISTS" = "yes" ]; then
        echo "📦 Found database in old volume structure. Migrating..."

        # Copy database from old volume to a temp location
        docker run --rm \
            -v car_maintenance_tracker_db-data:/olddata \
            -v "$(pwd)/backups:/backup" \
            alpine \
            cp /olddata/car_maintenance.db /backup/migrate_temp.db

        # Copy to the new instance directory in the container
        docker cp "$(pwd)/backups/migrate_temp.db" car-maintenance-backend:/app/instance/car_maintenance.db 2>/dev/null || {
            echo "⏳ Container not ready yet, will retry after startup..."
            return 1
        }

        rm -f "$(pwd)/backups/migrate_temp.db"
        echo "✅ Database migrated to new location"
        return 0
    else
        echo "✅ No migration needed"
        return 0
    fi
}

# Main deployment process
main() {
    check_docker

    # Ask if user wants to backup first
    read -p "Do you want to backup the database first? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        backup_db
    fi

    pull_changes
    stop_containers
    start_containers

    echo ""
    echo "⏳ Waiting for containers to be healthy..."
    sleep 10

    # Migrate database if needed (one-time migration from old volume structure)
    if ! migrate_db_volume; then
        sleep 5
        migrate_db_volume
        # Restart backend to pick up migrated database
        echo "🔄 Restarting backend to load migrated database..."
        $DOCKER_COMPOSE -f docker-compose.prod.yml restart backend
        sleep 5
    fi

    show_status

    echo ""
    echo "========================================="
    echo "✅ Deployment Complete!"
    echo "========================================="
    echo ""
    echo "🌐 Application is running at: http://$(hostname -I | awk '{print $1}'):3000"
    echo ""
    echo "Useful commands:"
    echo "  View logs:       $DOCKER_COMPOSE -f docker-compose.prod.yml logs -f"
    echo "  Stop app:        $DOCKER_COMPOSE -f docker-compose.prod.yml down"
    echo "  Restart app:     $DOCKER_COMPOSE -f docker-compose.prod.yml restart"
    echo "  View status:     $DOCKER_COMPOSE -f docker-compose.prod.yml ps"
    echo ""
}

# Run main function
main
