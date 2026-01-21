#!/bin/bash

# Test cluster import after PostgreSQL migration
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxYTI1NTAyYy1jMzVhLTRhZDEtYWJmYi1kY2I0OGE2YTM5MjMiLCJleHAiOjE3Njg4OTY1MzEsInR5cGUiOiJhY2Nlc3MiLCJlbWFpbCI6InRlc3R1c2VyQGdtYWlsLmNvbSJ9.pKvk00JFZ_by93EtjiJWsRoPJXg_6z1weZ-3BWQUzeY"

echo "Testing cluster creation..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:8888/api/clusters/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "final-test-cluster",
    "description": "Testing PostgreSQL migration",
    "context_name": "microk8s"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status: $HTTP_CODE"
echo "Response Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "201" ]; then
    echo "✅ SUCCESS! Cluster created successfully!"
    exit 0
else
    echo "❌ FAILED with status $HTTP_CODE"
    exit 1
fi
