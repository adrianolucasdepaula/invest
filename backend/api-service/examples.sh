#!/bin/bash
# Example API calls for B3 Scraper Test API

API_BASE="http://localhost:8000"

echo "🧪 B3 Scraper Test API - Example Calls"
echo "======================================="
echo ""

# 1. Health check
echo "1️⃣  Health Check"
echo "   curl $API_BASE/health"
curl -s $API_BASE/health | jq
echo ""
echo ""

# 2. API Ping
echo "2️⃣  API Ping"
echo "   curl $API_BASE/api/scrapers/ping"
curl -s $API_BASE/api/scrapers/ping | jq
echo ""
echo ""

# 3. List all scrapers
echo "3️⃣  List All Scrapers"
echo "   curl $API_BASE/api/scrapers/list"
curl -s $API_BASE/api/scrapers/list | jq '.total, .public, .private, .categories'
echo ""
echo ""

# 4. List scrapers by category
echo "4️⃣  List Fundamental Analysis Scrapers"
echo "   curl $API_BASE/api/scrapers/list?category=fundamental_analysis"
curl -s "$API_BASE/api/scrapers/list?category=fundamental_analysis" | jq '.scrapers[] | {id, name, requires_login}'
echo ""
echo ""

# 5. Test a public scraper
echo "5️⃣  Test Fundamentus Scraper"
echo "   curl -X POST $API_BASE/api/scrapers/test -d '{\"scraper\":\"FUNDAMENTUS\",\"query\":\"PETR4\"}'"
curl -s -X POST $API_BASE/api/scrapers/test \
  -H "Content-Type: application/json" \
  -d '{"scraper":"FUNDAMENTUS","query":"PETR4"}' | jq '.success, .execution_time'
echo ""
echo ""

# 6. Get scrapers health
echo "6️⃣  Get Scrapers Health Status"
echo "   curl $API_BASE/api/scrapers/health"
curl -s $API_BASE/api/scrapers/health | jq '.overall_health, .healthy_percentage, .healthy, .unhealthy'
echo ""
echo ""

# 7. Check cookies status
echo "7️⃣  Check Google OAuth Cookies Status"
echo "   curl $API_BASE/api/scrapers/cookies/status"
curl -s $API_BASE/api/scrapers/cookies/status | jq '.exists, .valid, .age_days, .expires_in_days, .severity'
echo ""
echo ""

# 8. Test all fundamental analysis scrapers
echo "8️⃣  Test All Fundamental Analysis Scrapers"
echo "   curl -X POST $API_BASE/api/scrapers/test-all -d '{\"category\":\"fundamental_analysis\",\"query\":\"PETR4\"}'"
curl -s -X POST $API_BASE/api/scrapers/test-all \
  -H "Content-Type: application/json" \
  -d '{"category":"fundamental_analysis","query":"PETR4","max_concurrent":3}' | jq '.total_tested, .success, .failures, .execution_time'
echo ""
echo ""

echo "✅ Examples complete!"
echo ""
echo "📚 For full documentation, visit: $API_BASE/docs"
