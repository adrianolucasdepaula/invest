#!/bin/bash

# Test PETR4 bulk update
echo "🔐 Fazendo login..."
TOKEN=$(curl -s -X POST "http://localhost:3101/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@invest.com", "password": "Admin@123"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo "✅ Token obtido (${#TOKEN} chars)"

echo "📊 Testando update PETR4..."
curl -s -X POST "http://localhost:3101/api/v1/assets/updates/single" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ticker": "PETR4"}' | jq '.'

echo ""
echo "✅ Teste completo"
