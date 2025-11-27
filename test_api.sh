#!/bin/bash

# Car Maintenance Tracker API Test Script
# Make sure the application is running with: docker-compose up

BASE_URL="http://localhost:5001/api"

echo "======================================"
echo "Car Maintenance Tracker API Tests"
echo "======================================"
echo ""

# Test 1: Get all vehicles (should be empty initially)
echo "Test 1: GET /api/vehicles (should be empty)"
curl -s -X GET "${BASE_URL}/vehicles" | python3 -m json.tool
echo ""
echo ""

# Test 2: Create a vehicle
echo "Test 2: POST /api/vehicles (create Toyota Camry)"
VEHICLE_RESPONSE=$(curl -s -X POST "${BASE_URL}/vehicles" \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2020,
    "make": "Toyota",
    "model": "Camry",
    "engine_type": "2.5L 4-cylinder",
    "current_mileage": 25000
  }')
echo "$VEHICLE_RESPONSE" | python3 -m json.tool
VEHICLE_ID=$(echo "$VEHICLE_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
echo ""
echo "Created vehicle with ID: $VEHICLE_ID"
echo ""

# Test 3: Get the vehicle we just created
echo "Test 3: GET /api/vehicles/${VEHICLE_ID}"
curl -s -X GET "${BASE_URL}/vehicles/${VEHICLE_ID}" | python3 -m json.tool
echo ""
echo ""

# Test 4: Create a maintenance item for the vehicle
echo "Test 4: POST /api/maintenance-items (create Oil Change)"
ITEM_RESPONSE=$(curl -s -X POST "${BASE_URL}/maintenance-items" \
  -H "Content-Type: application/json" \
  -d "{
    \"vehicle_id\": ${VEHICLE_ID},
    \"name\": \"Oil Change\",
    \"maintenance_type\": \"mileage\",
    \"frequency_value\": 5000,
    \"frequency_unit\": \"miles\",
    \"notes\": \"Use 5W-30 synthetic oil\"
  }")
echo "$ITEM_RESPONSE" | python3 -m json.tool
ITEM_ID=$(echo "$ITEM_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
echo ""
echo "Created maintenance item with ID: $ITEM_ID"
echo ""

# Test 5: Create another maintenance item
echo "Test 5: POST /api/maintenance-items (create Tire Rotation)"
ITEM2_RESPONSE=$(curl -s -X POST "${BASE_URL}/maintenance-items" \
  -H "Content-Type: application/json" \
  -d "{
    \"vehicle_id\": ${VEHICLE_ID},
    \"name\": \"Tire Rotation\",
    \"maintenance_type\": \"mileage\",
    \"frequency_value\": 10000,
    \"frequency_unit\": \"miles\"
  }")
echo "$ITEM2_RESPONSE" | python3 -m json.tool
ITEM2_ID=$(echo "$ITEM2_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
echo ""
echo ""

# Test 6: Get all maintenance items for the vehicle
echo "Test 6: GET /api/maintenance-items?vehicle_id=${VEHICLE_ID}"
curl -s -X GET "${BASE_URL}/maintenance-items?vehicle_id=${VEHICLE_ID}" | python3 -m json.tool
echo ""
echo ""

# Test 7: Create a maintenance log
echo "Test 7: POST /api/maintenance-logs (log oil change)"
LOG_RESPONSE=$(curl -s -X POST "${BASE_URL}/maintenance-logs" \
  -H "Content-Type: application/json" \
  -d "{
    \"maintenance_item_id\": ${ITEM_ID},
    \"date_performed\": \"2024-11-27\",
    \"mileage\": 30000,
    \"notes\": \"Completed oil change at local shop\"
  }")
echo "$LOG_RESPONSE" | python3 -m json.tool
LOG_ID=$(echo "$LOG_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
echo ""
echo "Created maintenance log with ID: $LOG_ID"
echo ""

# Test 8: Verify vehicle mileage was updated
echo "Test 8: GET /api/vehicles/${VEHICLE_ID} (verify mileage updated)"
curl -s -X GET "${BASE_URL}/vehicles/${VEHICLE_ID}" | python3 -m json.tool
echo ""
echo "NOTE: current_mileage should now be 30000"
echo ""

# Test 9: Get maintenance logs for the item
echo "Test 9: GET /api/maintenance-logs?maintenance_item_id=${ITEM_ID}"
curl -s -X GET "${BASE_URL}/maintenance-logs?maintenance_item_id=${ITEM_ID}" | python3 -m json.tool
echo ""
echo ""

# Test 10: Update vehicle mileage
echo "Test 10: PUT /api/vehicles/${VEHICLE_ID} (update mileage)"
curl -s -X PUT "${BASE_URL}/vehicles/${VEHICLE_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "current_mileage": 32000
  }' | python3 -m json.tool
echo ""
echo ""

echo "======================================"
echo "All tests completed!"
echo "======================================"
echo ""
echo "Summary:"
echo "- Created vehicle ID: $VEHICLE_ID"
echo "- Created maintenance items: $ITEM_ID (Oil Change), $ITEM2_ID (Tire Rotation)"
echo "- Created maintenance log: $LOG_ID"
echo ""
echo "To clean up, you can delete the vehicle (this will cascade delete items and logs):"
echo "curl -X DELETE ${BASE_URL}/vehicles/${VEHICLE_ID}"
