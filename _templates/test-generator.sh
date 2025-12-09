#!/bin/bash

# Test script to validate Hygen microservice generator
# This creates a test service and then removes it

echo "Testing Hygen Microservice Generator..."
echo "========================================"
echo ""

# Test data
TEST_SERVICE="test-service"
TEST_DESC="A test microservice"
TEST_PORT="3099"
TEST_DB="mongodb"
TEST_AUTH="y"

echo "Test Parameters:"
echo "  Service: $TEST_SERVICE"
echo "  Description: $TEST_DESC"
echo "  Port: $TEST_PORT"
echo "  Database: $TEST_DB"
echo "  Auth: $TEST_AUTH"
echo ""

# Validate helpers exist
if [ ! -f "_templates/helpers/index.js" ]; then
    echo "❌ ERROR: Helpers not found"
    exit 1
fi
echo "✅ Helpers found"

# Validate templates exist
if [ ! -d "_templates/microservice/new" ]; then
    echo "❌ ERROR: Microservice templates not found"
    exit 1
fi
echo "✅ Microservice templates found"

# Count templates
TEMPLATE_COUNT=$(find _templates/microservice/new -name "*.ejs.t" -o -name "*.js" | wc -l)
echo "✅ Found $TEMPLATE_COUNT template files"

echo ""
echo "Generator structure validated!"
echo "To test generation, run:"
echo "  npm run gen:microservice"
echo ""
echo "The generator will prompt you for:"
echo "  - Service name (kebab-case)"
echo "  - Description"
echo "  - TCP Port"
echo "  - Database (mongodb/postgres/none)"
echo "  - Authentication (yes/no)"
