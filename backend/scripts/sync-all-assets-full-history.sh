#!/bin/bash

#################################################
# Sync All Assets - Full Historical Data (1986-2024)
#################################################
#
# Sincroniza TODOS os ativos com histórico completo
# do COTAHIST B3 (1986-2024).
#
# Execução: bash sync-all-assets-full-history.sh
#################################################

API_URL="http://localhost:3101/api/v1"
START_YEAR=1986
END_YEAR=2024
MAX_PARALLEL=5  # Sync 5 ativos em paralelo
LOG_FILE="sync-all-assets.log"

echo "=========================================="
echo " Sync All Assets - Full History (1986-2024)"
echo "=========================================="
echo ""
echo "Fetching asset list..."

# Buscar todos os tickers
TICKERS=$(curl -s "$API_URL/assets" | grep -o '"ticker":"[^"]*"' | cut -d'"' -f4 | sort -u)
TOTAL_TICKERS=$(echo "$TICKERS" | wc -l)

echo "Found $TOTAL_TICKERS assets"
echo ""
echo "Starting sync with $MAX_PARALLEL parallel jobs..."
echo "Start Year: $START_YEAR"
echo "End Year: $END_YEAR"
echo ""
echo "Logs will be saved to: $LOG_FILE"
echo ""

# Limpar log anterior
> "$LOG_FILE"

# Contador
SUCCESS=0
FAILED=0
CURRENT=0

# Função para sincronizar um ticker
sync_ticker() {
  local ticker=$1
  local current=$2
  local total=$3

  echo "[$current/$total] Syncing $ticker..." | tee -a "$LOG_FILE"

  START_TIME=$(date +%s)

  RESPONSE=$(curl -X POST "$API_URL/market-data/sync-cotahist" \
    -H "Content-Type: application/json" \
    -d "{\"ticker\":\"$ticker\",\"startYear\":$START_YEAR,\"endYear\":$END_YEAR}" \
    -s -w "\nHTTP_CODE:%{http_code}" 2>&1)

  HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
  BODY=$(echo "$RESPONSE" | grep -v "HTTP_CODE")

  END_TIME=$(date +%s)
  DURATION=$((END_TIME - START_TIME))

  if [ "$HTTP_CODE" = "200" ]; then
    RECORDS=$(echo "$BODY" | grep -o '"totalRecords":[0-9]*' | cut -d: -f2)
    echo "  ✅ SUCCESS: $ticker ($RECORDS records, ${DURATION}s)" | tee -a "$LOG_FILE"
    return 0
  else
    echo "  ❌ FAILED: $ticker (HTTP $HTTP_CODE, ${DURATION}s)" | tee -a "$LOG_FILE"
    echo "  Error: $BODY" | tee -a "$LOG_FILE"
    return 1
  fi
}

export -f sync_ticker
export API_URL START_YEAR END_YEAR LOG_FILE

# Executar syncs em paralelo (GNU parallel ou xargs)
echo "$TICKERS" | nl | parallel -j $MAX_PARALLEL --colsep '\t' \
  "sync_ticker {2} {1} $TOTAL_TICKERS && echo 'SUCCESS' || echo 'FAILED'" | \
  grep -c "SUCCESS" > /tmp/success_count &

PARALLEL_PID=$!

# Aguardar conclusão
wait $PARALLEL_PID

SUCCESS=$(cat /tmp/success_count 2>/dev/null || echo 0)
FAILED=$((TOTAL_TICKERS - SUCCESS))

echo ""
echo "=========================================="
echo " Sync Complete!"
echo "=========================================="
echo "Total Assets: $TOTAL_TICKERS"
echo "Success: $SUCCESS"
echo "Failed: $FAILED"
echo ""
echo "Check logs: $LOG_FILE"
echo "=========================================="
