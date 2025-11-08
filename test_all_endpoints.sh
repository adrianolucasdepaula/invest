#!/bin/bash
# Script para testar TODOS os endpoints da API

API_URL="http://localhost:3101/api/v1"
OUTPUT_FILE="/tmp/api_test_results.json"

echo "{"
echo '  "timestamp": "'$(date -Iseconds)'",'
echo '  "tests": ['

# Teste 1: Health Check
echo -n '    { "name": "GET /health", '
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/../health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)
echo '"status": '$([ "$HTTP_CODE" = "200" ] && echo "true" || echo "false")', "code": '$HTTP_CODE', "response": '"'"$BODY"'"' },'

# Teste 2: Root
echo -n '    { "name": "GET /", '
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
echo '"status": '$([ "$HTTP_CODE" = "200" ] && echo "true" || echo "false")', "code": '$HTTP_CODE' },'

# Teste 3: List Assets
echo -n '    { "name": "GET /assets", '
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/assets")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)
COUNT=$(echo "$BODY" | jq 'length' 2>/dev/null || echo "0")
echo '"status": '$([ "$HTTP_CODE" = "200" ] && echo "true" || echo "false")', "code": '$HTTP_CODE', "count": '$COUNT' },'

# Teste 4: Get Asset by Ticker
echo -n '    { "name": "GET /assets/VALE3", '
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/assets/VALE3")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
echo '"status": '$([ "$HTTP_CODE" = "200" ] && echo "true" || echo "false")', "code": '$HTTP_CODE' },'

# Teste 5: Asset Price History
echo -n '    { "name": "GET /assets/VALE3/price-history", '
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/assets/VALE3/price-history")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
echo '"status": '$([ "$HTTP_CODE" = "200" ] && echo "true" || echo "false")', "code": '$HTTP_CODE' },'

# Teste 6: Sync Asset (protegido)
echo -n '    { "name": "POST /assets/VALE3/sync", '
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/assets/VALE3/sync")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
echo '"status": '$([ "$HTTP_CODE" = "401" ] && echo "true" || echo "false")', "code": '$HTTP_CODE', "note": "Expected 401 (protected)" },'

# Teste 7: Data Sources
echo -n '    { "name": "GET /data-sources", '
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/data-sources")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
echo '"status": '$([ "$HTTP_CODE" = "200" ] && echo "true" || echo "false")', "code": '$HTTP_CODE' },'

# Teste 8: Data Sources Status
echo -n '    { "name": "GET /data-sources/status", '
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/data-sources/status")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
echo '"status": '$([ "$HTTP_CODE" = "200" ] && echo "true" || echo "false")', "code": '$HTTP_CODE' },'

# Teste 9: Generate Analysis (protegido)
echo -n '    { "name": "POST /analysis/VALE3/fundamental", '
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/analysis/VALE3/fundamental")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
echo '"status": '$([ "$HTTP_CODE" = "401" ] && echo "true" || echo "false")', "code": '$HTTP_CODE', "note": "Expected 401 (protected)" },'

# Teste 10: Get Analysis (protegido)
echo -n '    { "name": "GET /analysis/VALE3", '
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/analysis/VALE3")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
echo '"status": '$([ "$HTTP_CODE" = "401" ] && echo "true" || echo "false")', "code": '$HTTP_CODE', "note": "Expected 401 (protected)" },'

# Teste 11: List Portfolios (protegido)
echo -n '    { "name": "GET /portfolio", '
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/portfolio")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
echo '"status": '$([ "$HTTP_CODE" = "401" ] && echo "true" || echo "false")', "code": '$HTTP_CODE', "note": "Expected 401 (protected)" },'

# Teste 12: Register (sem dados)
echo -n '    { "name": "POST /auth/register (no data)", '
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" "$API_URL/auth/register")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
echo '"status": '$([ "$HTTP_CODE" = "400" ] && echo "true" || echo "false")', "code": '$HTTP_CODE', "note": "Expected 400 (bad request)" },'

# Teste 13: Login (sem dados)
echo -n '    { "name": "POST /auth/login (no data)", '
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" "$API_URL/auth/login")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
echo '"status": '$([ "$HTTP_CODE" = "400" ] && echo "true" || echo "false")', "code": '$HTTP_CODE', "note": "Expected 400 (bad request)" }'

echo ""
echo "  ]"
echo "}"
