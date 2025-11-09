# Script Simplificado para Configurar OAuth
# B3 AI Analysis Platform - Configuração OAuth Manual

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  Configuração OAuth - B3 AI Analysis Platform" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se api-service está rodando
Write-Host "[1/4] Verificando api-service..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8000/api/oauth/health" -Method Get -TimeoutSec 5
    Write-Host "✅ API OAuth está funcionando: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ ERRO: api-service não está respondendo" -ForegroundColor Red
    Write-Host "Execute: docker-compose up -d api-service" -ForegroundColor Yellow
    exit 1
}

# Verificar VNC
Write-Host ""
Write-Host "[2/4] Verificando VNC..." -ForegroundColor Yellow
try {
    $vnc = Invoke-WebRequest -Uri "http://localhost:6080/vnc.html" -Method Head -TimeoutSec 5
    if ($vnc.StatusCode -eq 200) {
        Write-Host "✅ VNC está acessível" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ ERRO: VNC não está acessível" -ForegroundColor Red
    Write-Host "Execute: docker restart invest_scrapers" -ForegroundColor Yellow
    exit 1
}

# Listar sites OAuth
Write-Host ""
Write-Host "[3/4] Listando sites OAuth disponíveis..." -ForegroundColor Yellow
try {
    $sites = Invoke-RestMethod -Uri "http://localhost:8000/api/oauth/sites" -Method Get
    Write-Host "✅ Total de sites: $($sites.sites.Count)" -ForegroundColor Green
    Write-Host "   - Sites obrigatórios: $($sites.metadata.required_sites)" -ForegroundColor Cyan
    Write-Host "   - Sites opcionais: $($sites.metadata.optional_sites)" -ForegroundColor Cyan
    Write-Host "   - Tempo estimado: $($sites.metadata.estimated_time_minutes) minutos" -ForegroundColor Cyan
} catch {
    Write-Host "❌ ERRO ao listar sites" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[4/4] URLs para Configuração Manual:" -ForegroundColor Yellow
Write-Host ""
Write-Host "🌐 OPÇÃO 1: VNC Direto (RECOMENDADO)" -ForegroundColor Green
Write-Host "   URL: http://localhost:6080/vnc.html" -ForegroundColor White
Write-Host "   1. Abra a URL acima no navegador" -ForegroundColor Gray
Write-Host "   2. Clique em 'Connect'" -ForegroundColor Gray
Write-Host "   3. Você verá o desktop remoto" -ForegroundColor Gray
Write-Host "   4. Chrome abrirá automaticamente quando você iniciar a sessão" -ForegroundColor Gray
Write-Host ""

Write-Host "🔧 OPÇÃO 2: Iniciar Sessão via API" -ForegroundColor Green
Write-Host "   Execute o comando abaixo para iniciar a sessão OAuth:" -ForegroundColor Gray
Write-Host ""
Write-Host '   Invoke-RestMethod -Uri "http://localhost:8000/api/oauth/session/start" -Method Post' -ForegroundColor Cyan
Write-Host ""

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  Instruções Detalhadas" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "PASSO A PASSO COMPLETO:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Abra o VNC no navegador:" -ForegroundColor White
Write-Host "   http://localhost:6080/vnc.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Inicie a sessão OAuth executando:" -ForegroundColor White
Write-Host '   Invoke-RestMethod -Uri "http://localhost:8000/api/oauth/session/start" -Method Post' -ForegroundColor Cyan
Write-Host ""
Write-Host "3. No VNC, você verá o Chrome abrindo automaticamente" -ForegroundColor White
Write-Host ""
Write-Host "4. Faça login nos sites conforme solicitado:" -ForegroundColor White
Write-Host "   - Google (obrigatório)" -ForegroundColor Cyan
Write-Host "   - Fundamentei (OAuth Google)" -ForegroundColor Cyan
Write-Host "   - Investidor10 (OAuth Google)" -ForegroundColor Cyan
Write-Host "   - StatusInvest (OAuth Google)" -ForegroundColor Cyan
Write-Host "   - Investing.com (OAuth Google)" -ForegroundColor Cyan
Write-Host "   - TradingView (OAuth Google)" -ForegroundColor Cyan
Write-Host "   - Google Finance (Auto)" -ForegroundColor Cyan
Write-Host "   - Gemini (Auto Google)" -ForegroundColor Cyan
Write-Host "   - Google News (Auto Google)" -ForegroundColor Cyan
Write-Host "   - Mais Retorno (OAuth Google)" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. Após fazer login em cada site, confirme via API:" -ForegroundColor White
Write-Host '   Invoke-RestMethod -Uri "http://localhost:8000/api/oauth/session/confirm-login" -Method Post' -ForegroundColor Cyan
Write-Host ""
Write-Host "6. Para pular um site opcional:" -ForegroundColor White
Write-Host '   Invoke-RestMethod -Uri "http://localhost:8000/api/oauth/session/skip-site" -Method Post' -ForegroundColor Cyan
Write-Host ""
Write-Host "7. Ao finalizar todos os logins, salve os cookies:" -ForegroundColor White
Write-Host '   Invoke-RestMethod -Uri "http://localhost:8000/api/oauth/session/save" -Method Post' -ForegroundColor Cyan
Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Sistema pronto para configuração OAuth!" -ForegroundColor Green
Write-Host "📋 Consulte RELATORIO_FINAL_CORRECOES.md para mais detalhes" -ForegroundColor Gray
Write-Host ""

# Perguntar se quer iniciar agora
Write-Host "Deseja iniciar a sessão OAuth agora? (S/N): " -ForegroundColor Yellow -NoNewline
$resposta = Read-Host

if ($resposta -eq "S" -or $resposta -eq "s") {
    Write-Host ""
    Write-Host "Iniciando sessão OAuth..." -ForegroundColor Green
    try {
        $session = Invoke-RestMethod -Uri "http://localhost:8000/api/oauth/session/start" -Method Post
        Write-Host "✅ Sessão iniciada com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Abra o VNC agora:" -ForegroundColor Yellow
        Write-Host "http://localhost:6080/vnc.html" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Site atual: $($session.current_site.name)" -ForegroundColor White
        Write-Host "URL: $($session.current_site.url)" -ForegroundColor Gray
        Write-Host "Instruções: $($session.current_site.instructions)" -ForegroundColor Gray
        Write-Host ""

        # Abrir VNC automaticamente
        Start-Process "http://localhost:6080/vnc.html"
    } catch {
        Write-Host "❌ ERRO ao iniciar sessão:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "OK. Você pode iniciar manualmente quando quiser." -ForegroundColor Gray
    Write-Host "Execute novamente este script ou use os comandos acima." -ForegroundColor Gray
}

Write-Host ""
