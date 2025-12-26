#!/bin/bash
# Monitor Contínuo da Coleta - Executa a cada 5min
# Uso: ./monitor_continuo.sh

LOG_FILE="monitoramento_coleta_$(date +%Y%m%d_%H%M%S).log"

echo "=== MONITOR CONTÍNUO INICIADO ===" | tee -a $LOG_FILE
echo "Log file: $LOG_FILE" | tee -a $LOG_FILE
echo "" | tee -a $LOG_FILE

while true; do
  TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
  echo "=== CHECKPOINT - $TIMESTAMP ===" | tee -a $LOG_FILE

  # 1. COLETA (BullMQ)
  echo "" | tee -a $LOG_FILE
  echo "📊 COLETA (BullMQ):" | tee -a $LOG_FILE
  docker exec invest_redis redis-cli ZCARD "bull:asset-updates:completed" 2>/dev/null | xargs echo "  Completed:" | tee -a $LOG_FILE
  docker exec invest_redis redis-cli ZCARD "bull:asset-updates:failed" 2>/dev/null | xargs echo "  Failed:" | tee -a $LOG_FILE
  docker exec invest_redis redis-cli LLEN "bull:asset-updates:waiting" 2>/dev/null | xargs echo "  Waiting:" | tee -a $LOG_FILE
  docker exec invest_redis redis-cli LLEN "bull:asset-updates:active" 2>/dev/null | xargs echo "  Active:" | tee -a $LOG_FILE

  # 2. DADOS (PostgreSQL)
  echo "" | tee -a $LOG_FILE
  echo "💾 DADOS:" | tee -a $LOG_FILE
  docker exec invest_postgres psql -U invest_user -d invest_db -f monitor_coleta.sql 2>&1 | tee -a $LOG_FILE

  # 3. PYTHON API HEALTH
  echo "" | tee -a $LOG_FILE
  echo "🔧 PYTHON API:" | tee -a $LOG_FILE
  timeout 5 curl -s http://localhost:8000/health > /dev/null 2>&1 && echo "  Status: OK ✅" | tee -a $LOG_FILE || echo "  Status: TIMEOUT ⚠️" | tee -a $LOG_FILE

  # 4. RECURSOS
  echo "" | tee -a $LOG_FILE
  echo "📈 RECURSOS (invest_api_service):" | tee -a $LOG_FILE
  docker stats invest_api_service --no-stream --format "  CPU: {{.CPUPerc}}, Memory: {{.MemPerc}} ({{.MemUsage}})" 2>&1 | tee -a $LOG_FILE
  docker exec invest_api_service ps aux | grep -c "defunct" | xargs echo "  Zombies:" | tee -a $LOG_FILE

  # 5. ERROS RECENTES
  echo "" | tee -a $LOG_FILE
  echo "🔴 ERROS (últimos 5min):" | tee -a $LOG_FILE
  docker exec invest_postgres psql -U invest_user -d invest_db -c "SELECT scraper_id, error_type, COUNT(*) FROM scraper_errors WHERE created_at > NOW() - INTERVAL '5 minutes' GROUP BY scraper_id, error_type ORDER BY COUNT(*) DESC LIMIT 5;" 2>&1 | tee -a $LOG_FILE

  echo "" | tee -a $LOG_FILE
  echo "────────────────────────────────────────" | tee -a $LOG_FILE
  echo "" | tee -a $LOG_FILE

  # Aguardar 5min antes do próximo checkpoint
  sleep 300
done
