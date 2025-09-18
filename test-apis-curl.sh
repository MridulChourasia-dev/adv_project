#!/bin/bash

# API Testing Script for Advanced Project
# Tests basic connectivity and endpoint availability

echo "🚀 API Connectivity Testing Script"
echo "=================================="

BASE_URL="http://localhost:5500"
API_BASE="/api/v1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Results tracking
passed=0
failed=0
total=0

# Test function
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local expected_status="$4"
    local data="$5"
    
    total=$((total + 1))
    
    echo -n "Testing $name: $method $endpoint ... "
    
    if [ -n "$data" ]; then
        # POST/PUT with data
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -H "User-Agent: API-Test-Script/1.0" \
            -d "$data" \
            "$BASE_URL$endpoint" 2>&1)
    else
        # GET/DELETE without data
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "User-Agent: API-Test-Script/1.0" \
            "$BASE_URL$endpoint" 2>&1)
    fi
    
    # Extract status code (last line)
    status_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | head -n -1)
    
    # Check if curl command failed
    if [[ "$status_code" =~ ^[0-9]+$ ]]; then
        if [ "$status_code" -eq "$expected_status" ]; then
            echo -e "${GREEN}✅ PASS${NC} ($status_code)"
            passed=$((passed + 1))
        else
            echo -e "${RED}❌ FAIL${NC} (expected $expected_status, got $status_code)"
            failed=$((failed + 1))
            # Show first 100 chars of response for debugging
            if [ ${#response_body} -gt 0 ]; then
                echo "   Response: ${response_body:0:100}$([ ${#response_body} -gt 100 ] && echo '...')"
            fi
        fi
    else
        echo -e "${RED}❌ ERROR${NC} (Connection failed)"
        failed=$((failed + 1))
        echo "   Error: $response"
    fi
}

# Check if server is running
echo "🔍 Checking if server is running at $BASE_URL"
if ! curl -s --connect-timeout 5 "$BASE_URL" > /dev/null; then
    echo -e "${RED}❌ Server is not running or not accessible${NC}"
    echo "Please start the server first with: npm start"
    exit 1
fi

echo -e "${GREEN}✅ Server is running${NC}"
echo ""

# Test basic endpoints
echo "🌐 Testing Basic Endpoints:"
test_endpoint "Home Page" "GET" "/" 200
test_endpoint "Swagger Documentation" "GET" "/api-docs/" 200

echo ""
echo "🔐 Testing Authentication Endpoints:"
test_endpoint "Sign Up (no data)" "POST" "$API_BASE/auth/sign-up" 400
test_endpoint "Sign In (no data)" "POST" "$API_BASE/auth/sign-in" 400
test_endpoint "Sign Out" "POST" "$API_BASE/auth/sign-out" 200

echo ""
echo "👥 Testing User Endpoints:"
test_endpoint "Get All Users" "GET" "$API_BASE/users" 200
test_endpoint "Get User by ID (no auth)" "GET" "$API_BASE/users/test123" 401
test_endpoint "Create User (placeholder)" "POST" "$API_BASE/users" 200
test_endpoint "Update User (placeholder)" "PUT" "$API_BASE/users/test123" 200
test_endpoint "Delete User (placeholder)" "DELETE" "$API_BASE/users/test123" 200

echo ""
echo "💰 Testing Subscription Endpoints (expect auth required):"
test_endpoint "Get All Subscriptions" "GET" "$API_BASE/subscriptions" 401
test_endpoint "Get Subscription by ID" "GET" "$API_BASE/subscriptions/test123" 401
test_endpoint "Create Subscription" "POST" "$API_BASE/subscriptions" 401
test_endpoint "Update Subscription" "PUT" "$API_BASE/subscriptions/test123" 401
test_endpoint "Delete Subscription" "DELETE" "$API_BASE/subscriptions/test123" 401
test_endpoint "Get User Subscriptions" "GET" "$API_BASE/subscriptions/user/test123" 401
test_endpoint "Cancel Subscription" "PUT" "$API_BASE/subscriptions/test123/cancel" 401
test_endpoint "Get Upcoming Renewals" "GET" "$API_BASE/subscriptions/upcoming-renewals" 401

echo ""
echo "⚡ Testing Workflow Endpoints:"
test_endpoint "Send Reminders" "POST" "$API_BASE/workflows/subscription/reminder" 200

echo ""
echo "🔍 Testing Non-existent Endpoints:"
test_endpoint "Non-existent endpoint" "GET" "/api/v1/nonexistent" 404

echo ""
echo "============================================================"
echo "📊 TEST RESULTS SUMMARY"
echo "============================================================"
echo "Total Tests: $total"
echo -e "Passed: ${GREEN}$passed ✅${NC}"
echo -e "Failed: ${RED}$failed ❌${NC}"

success_rate=$(echo "scale=1; $passed * 100 / $total" | bc -l 2>/dev/null || echo "0")
echo "Success Rate: ${success_rate}%"

if [ $failed -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "\n${YELLOW}⚠️  Some endpoints may need database connectivity or proper request data.${NC}"
    exit 1
fi