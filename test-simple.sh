#!/bin/bash
# Test PETR4 bulk update with simple curl

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYjY0ZDRlYy1lZjc2LTRlYzgtYjJiZS0xZTAxY2NkZWMxYTQiLCJlbWFpbCI6ImFkbWluQGludmVzdC5jb20iLCJpYXQiOjE3NjY5MTg5NTgsImV4cCI6MTc2NzUyMzc1OH0.cxZ8GeQGEPcgPWUw48lUBxxl0JtoaW5nttt3yEufi7Y"

echo "Testing PETR4 update..."
curl -s -X POST "http://localhost:3101/api/v1/assets/updates/single" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ticker":"PETR4"}' \
  | head -200

echo ""
echo "Done!"
