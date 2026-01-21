#!/bin/bash
set -e

# Ensure instance and uploads directories exist with correct permissions
mkdir -p /app/instance /app/uploads
chmod 755 /app/instance /app/uploads

# Fix database permissions if it exists
if [ -f /app/instance/car_maintenance.db ]; then
    chmod 666 /app/instance/car_maintenance.db
fi

# Execute the main command
exec "$@"
