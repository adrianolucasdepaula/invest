# B3 AI Analysis Platform - System Manager (PowerShell)
# This script manages the entire system lifecycle with intelligent checks

# Colors for output
$ESC = [char]27
$RED = "$ESC[31m"
$GREEN = "$ESC[32m"
$YELLOW = "$ESC[33m"
$BLUE = "$ESC[34m"
$CYAN = "$ESC[36m"
$RESET = "$ESC[0m"

# Function to print colored output
function Print-Info {
    param([string]$Message)
    Write-Host "${BLUE}ℹ${RESET} $Message"
}

function Print-Success {
    param([string]$Message)
    Write-Host "${GREEN}✓${RESET} $Message"
}

function Print-Warning {
    param([string]$Message)
    Write-Host "${YELLOW}⚠${RESET} $Message"
}

function Print-Error {
    param([string]$Message)
    Write-Host "${RED}✗${RESET} $Message"
}

function Print-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "${BLUE}============================================${RESET}"
    Write-Host "${BLUE}  $Message${RESET}"
    Write-Host "${BLUE}============================================${RESET}"
    Write-Host ""
}

# Check if command exists
function Test-Command {
    param([string]$Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

# Check prerequisites
function Test-Prerequisites {
    Print-Header "Verificando Pré-requisitos"

    $allOk = $true

    # Check Docker
    if (Test-Command docker) {
        $dockerVersion = docker --version
        Print-Success "Docker instalado: $dockerVersion"
    } else {
        Print-Error "Docker não está instalado"
        Write-Host "Instale Docker Desktop: https://docs.docker.com/desktop/install/windows-install/"
        $allOk = $false
    }

    # Check Docker Compose
    if (Test-Command docker-compose) {
        $composeVersion = docker-compose --version
        Print-Success "Docker Compose instalado: $composeVersion"
    } elseif (docker compose version 2>$null) {
        $composeVersion = docker compose version
        Print-Success "Docker Compose (plugin) instalado: $composeVersion"
    } else {
        Print-Error "Docker Compose não está instalado"
        $allOk = $false
    }

    # Check if Docker daemon is running
    try {
        docker ps | Out-Null
        Print-Success "Docker daemon está rodando"
    } catch {
        Print-Error "Docker daemon não está rodando"
        Write-Host "Inicie o Docker Desktop"
        $allOk = $false
    }

    # Check Node.js
    if (Test-Command node) {
        $nodeVersion = node --version
        Print-Success "Node.js instalado: $nodeVersion"
    } else {
        Print-Warning "Node.js não encontrado (necessário para desenvolvimento local)"
    }

    # Check npm
    if (Test-Command npm) {
        $npmVersion = npm --version
        Print-Success "npm instalado: v$npmVersion"
    } else {
        Print-Warning "npm não encontrado"
    }

    return $allOk
}

# Check for updates
function Test-Updates {
    Print-Header "Verificando Atualizações"

    try {
        $currentBranch = git branch --show-current
        Print-Info "Branch atual: $currentBranch"

        Print-Info "Buscando atualizações do repositório remoto..."
        git fetch origin $currentBranch 2>&1 | Out-Null

        $local = git rev-parse "@"
        $remote = git rev-parse "@{u}"
        $base = git merge-base "@" "@{u}"

        if ($local -eq $remote) {
            Print-Success "Código já está atualizado"
            $localCommit = git log -1 --format="%h - %s" HEAD
            Print-Info "Commit atual: $localCommit"
            return $false
        }

        # Check if local is behind remote
        if ($local -eq $base) {
            # Local está atrás do remote
            $behindCount = git rev-list --count "${local}..${remote}"
            Write-Host ""
            Print-Warning "Seu código está $behindCount commit(s) atrás do repositório remoto"
            Write-Host ""
            Write-Host "${YELLOW}Commits disponíveis:${RESET}"
            git log --oneline --decorate --color=always "${local}..${remote}" | ForEach-Object { Write-Host "  $_" }
            Write-Host ""

            $update = Read-Host "Deseja atualizar o código agora? (y/n)"
            if ($update -eq "y") {
                Print-Info "Atualizando código..."
                Write-Host ""

                $pullResult = git pull origin $currentBranch 2>&1

                if ($LASTEXITCODE -eq 0) {
                    Write-Host ""
                    Print-Success "Código atualizado com sucesso!"
                    Write-Host ""
                    Write-Host "${GREEN}Arquivos atualizados:${RESET}"
                    git diff --stat "${local}..HEAD" | ForEach-Object { Write-Host "  $_" }
                    Write-Host ""
                    return $true
                } else {
                    Write-Host ""
                    Print-Error "Erro ao atualizar código:"
                    Write-Host "$pullResult"
                    return $false
                }
            } else {
                Print-Warning "Continuando com versão desatualizada (não recomendado)"
                return $false
            }
        }
        elseif ($remote -eq $base) {
            # Local está à frente do remote
            Print-Warning "Seu código local está à frente do remote (você tem commits não enviados)"
            return $false
        }
        else {
            # Diverged
            Print-Warning "Seu código divergiu do remote. Execute 'git status' para detalhes"
            return $false
        }

    } catch {
        Print-Warning "Não foi possível verificar atualizações: $_"
    }

    return $false
}

# Check dependencies
function Test-Dependencies {
    Print-Header "Verificando Dependências"

    $needsInstall = $false
    $needsUpdate = $false

    # Check backend dependencies
    if (-not (Test-Path "backend/node_modules")) {
        Print-Warning "Dependências do backend não estão instaladas"
        $needsInstall = $true
    } elseif ((Get-Item "backend/package.json").LastWriteTime -gt (Get-Item "backend/node_modules").LastWriteTime) {
        Print-Warning "Dependências do backend estão desatualizadas"
        $needsUpdate = $true
    } else {
        Print-Success "Dependências do backend OK"
    }

    # Check frontend dependencies
    if (-not (Test-Path "frontend/node_modules")) {
        Print-Warning "Dependências do frontend não estão instaladas"
        $needsInstall = $true
    } elseif ((Get-Item "frontend/package.json").LastWriteTime -gt (Get-Item "frontend/node_modules").LastWriteTime) {
        Print-Warning "Dependências do frontend estão desatualizadas"
        $needsUpdate = $true
    } else {
        Print-Success "Dependências do frontend OK"
    }

    if ($needsInstall) {
        $install = Read-Host "Deseja instalar as dependências agora? (y/n)"
        if ($install -eq "y") {
            Install-Dependencies
            return $true
        }
    } elseif ($needsUpdate) {
        $update = Read-Host "Deseja atualizar as dependências? (y/n)"
        if ($update -eq "y") {
            Install-Dependencies
            return $true
        }
    }

    return $false
}

# Install dependencies
function Install-Dependencies {
    Print-Header "Instalando Dependências"

    # Backend
    if (-not (Test-Path "backend/node_modules") -or ((Get-Item "backend/package.json").LastWriteTime -gt (Get-Item "backend/node_modules").LastWriteTime)) {
        Print-Info "Instalando dependências do backend..."
        Push-Location backend
        npm install
        if ($LASTEXITCODE -eq 0) {
            Print-Success "Dependências do backend instaladas!"
        } else {
            Print-Error "Erro ao instalar dependências do backend"
        }
        Pop-Location
    }

    # Frontend
    if (-not (Test-Path "frontend/node_modules") -or ((Get-Item "frontend/package.json").LastWriteTime -gt (Get-Item "frontend/node_modules").LastWriteTime)) {
        Print-Info "Instalando dependências do frontend..."
        Push-Location frontend
        npm install
        if ($LASTEXITCODE -eq 0) {
            Print-Success "Dependências do frontend instaladas!"
        } else {
            Print-Error "Erro ao instalar dependências do frontend"
        }
        Pop-Location
    }
}

# Check Docker images
function Test-DockerImages {
    Print-Header "Verificando Imagens Docker"

    $needsBuild = $false

    # Check if custom images exist
    $backendImage = docker images invest_backend -q
    $frontendImage = docker images invest_frontend -q
    $scrapersImage = docker images invest_scrapers -q

    if (-not $backendImage) {
        Print-Warning "Imagem do backend não encontrada"
        $needsBuild = $true
    } else {
        Print-Success "Imagem do backend encontrada"
    }

    if (-not $frontendImage) {
        Print-Warning "Imagem do frontend não encontrada"
        $needsBuild = $true
    } else {
        Print-Success "Imagem do frontend encontrada"
    }

    if (-not $scrapersImage) {
        Print-Warning "Imagem dos scrapers não encontrada"
        $needsBuild = $true
    } else {
        Print-Success "Imagem dos scrapers encontrada"
    }

    if ($needsBuild) {
        $build = Read-Host "Deseja fazer o build das imagens Docker agora? (y/n)"
        if ($build -eq "y") {
            Build-DockerImages
            return $true
        }
    }

    return $false
}

# Build Docker images
function Build-DockerImages {
    Print-Header "Building Docker Images"

    Print-Info "Pulling base images..."
    docker-compose pull

    Print-Info "Building custom images..."
    docker-compose build

    if ($LASTEXITCODE -eq 0) {
        Print-Success "Imagens Docker criadas com sucesso!"
    } else {
        Print-Error "Erro ao criar imagens Docker"
    }
}

# Wait for services to be healthy
function Wait-ForHealthy {
    param(
        [int]$MaxWaitSeconds = 120,
        [array]$Services = @("postgres", "redis", "backend", "frontend", "scrapers")
    )

    Print-Info "Aguardando serviços ficarem prontos (timeout: ${MaxWaitSeconds}s)..."

    $waited = 0
    $checkInterval = 5

    while ($waited -lt $MaxWaitSeconds) {
        $allHealthy = $true
        $statusMessages = @()

        foreach ($service in $Services) {
            $containerName = "invest_$service"

            try {
                # Check if container exists and is running
                $containerState = docker inspect --format='{{.State.Status}}' $containerName 2>$null

                if ($containerState -ne "running") {
                    $allHealthy = $false
                    $statusMessages += "${YELLOW}⏳${RESET} $service (não rodando)"
                    continue
                }

                # Check health status
                $health = docker inspect --format='{{.State.Health.Status}}' $containerName 2>$null

                if ($health -eq "healthy") {
                    $statusMessages += "${GREEN}✓${RESET} $service"
                } elseif ($health -eq "starting") {
                    $allHealthy = $false
                    $statusMessages += "${YELLOW}⏳${RESET} $service (iniciando)"
                } elseif ($health -eq "unhealthy") {
                    $allHealthy = $false
                    $statusMessages += "${RED}✗${RESET} $service (não saudável)"
                } else {
                    # No health check defined, just check if running
                    $statusMessages += "${CYAN}ℹ${RESET} $service (sem health check)"
                }
            } catch {
                $allHealthy = $false
                $statusMessages += "${RED}✗${RESET} $service (erro: $_)"
            }
        }

        # Clear line and show status
        Write-Host "`r$(' ' * 100)`r" -NoNewline
        Write-Host "Status: $($statusMessages -join ' | ')" -NoNewline

        if ($allHealthy) {
            Write-Host ""
            Write-Host ""
            Print-Success "Todos os serviços estão prontos!"
            return $true
        }

        Start-Sleep -Seconds $checkInterval
        $waited += $checkInterval
    }

    Write-Host ""
    Write-Host ""
    Print-Warning "Timeout aguardando serviços (${MaxWaitSeconds}s). Alguns serviços podem não estar prontos."
    Print-Info "Verifique os logs: .\system-manager.ps1 logs <service>"
    return $false
}

# Validate essential files
function Test-EssentialFiles {
    Print-Header "Validando Arquivos Essenciais"

    $allOk = $true
    $essentialFiles = @(
        "docker-compose.yml",
        "backend/package.json",
        "frontend/package.json",
        "backend/Dockerfile",
        "frontend/Dockerfile",
        "backend/python-scrapers/Dockerfile",
        "backend/python-scrapers/requirements.txt",
        "database/postgresql.conf"
    )

    foreach ($file in $essentialFiles) {
        if (-not (Test-Path $file)) {
            Print-Error "Arquivo essencial não encontrado: $file"
            $allOk = $false
        }
    }

    # Check and create database directory
    if (-not (Test-Path "database")) {
        Print-Warning "Diretório 'database' não encontrado. Criando..."
        New-Item -ItemType Directory -Force -Path "database" | Out-Null
    }

    # Check and create init.sql
    if (-not (Test-Path "database/init.sql")) {
        Print-Warning "Arquivo 'database/init.sql' não encontrado. Criando arquivo padrão..."

        $initSql = @"
-- B3 AI Analysis Platform Database Initialization
-- Este arquivo é executado automaticamente na primeira vez que o PostgreSQL inicia

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create pg_trgm extension for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: The tables will be created automatically by TypeORM migrations
-- This script just ensures the necessary extensions are installed

-- After TypeORM creates the asset_prices table, we'll convert it to a hypertable
-- This will be done in a separate migration file

-- Log de inicialização
DO `$`$
BEGIN
    RAISE NOTICE 'B3 AI Analysis Platform - Database initialized successfully';
END
`$`$;
"@

        $initSql | Out-File -FilePath "database/init.sql" -Encoding UTF8
        Print-Success "Arquivo database/init.sql criado com sucesso!"
    } else {
        Print-Success "Arquivo database/init.sql encontrado"
    }

    # Check and create logs directory
    if (-not (Test-Path "logs")) {
        Print-Info "Criando diretório 'logs'..."
        New-Item -ItemType Directory -Force -Path "logs" | Out-Null
    }

    # Check and create uploads directory
    if (-not (Test-Path "uploads")) {
        Print-Info "Criando diretório 'uploads'..."
        New-Item -ItemType Directory -Force -Path "uploads" | Out-Null
    }

    # Check and create reports directory
    if (-not (Test-Path "reports")) {
        Print-Info "Criando diretório 'reports'..."
        New-Item -ItemType Directory -Force -Path "reports" | Out-Null
    }

    # Check and create browser-profiles directory
    if (-not (Test-Path "browser-profiles")) {
        Print-Info "Criando diretório 'browser-profiles'..."
        New-Item -ItemType Directory -Force -Path "browser-profiles" | Out-Null
    }

    # Check and create frontend/public directory (required by Next.js Dockerfile)
    if (-not (Test-Path "frontend/public")) {
        Print-Info "Criando diretório 'frontend/public'..."
        New-Item -ItemType Directory -Force -Path "frontend/public" | Out-Null
        # Create .gitkeep to preserve in git
        New-Item -ItemType File -Force -Path "frontend/public/.gitkeep" | Out-Null
    }

    if ($allOk) {
        Print-Success "Todos os arquivos essenciais estão presentes"
    }

    return $allOk
}

# Start system
function Start-System {
    Print-Header "Iniciando Sistema B3 AI Analysis Platform"

    # Validate essential files first
    if (-not (Test-EssentialFiles)) {
        Print-Error "Arquivos essenciais faltando. Corrija os problemas antes de continuar."
        return
    }

    # Prerequisites
    if (-not (Test-Prerequisites)) {
        Print-Error "Pré-requisitos não atendidos. Corrija os problemas antes de continuar."
        return
    }

    # Check for updates
    $codeUpdated = Test-Updates

    # Check dependencies
    $depsChanged = Test-Dependencies

    # Check Docker images
    $imagesChanged = Test-DockerImages

    # Suggest rebuild if needed
    if ($codeUpdated -or $depsChanged) {
        Print-Warning "Código ou dependências foram atualizados"
        $rebuild = Read-Host "Deseja fazer rebuild das imagens Docker? (y/n)"
        if ($rebuild -eq "y") {
            Build-DockerImages
        }
    }

    # Start services
    Print-Header "Iniciando Serviços Docker"
    Print-Info "Iniciando containers..."

    docker-compose up -d

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""

        # Wait for services to be healthy (with real health checks)
        $isHealthy = Wait-ForHealthy -MaxWaitSeconds 120

        if ($isHealthy) {
            # Show URLs
            Write-Host ""
            Print-Success "Sistema iniciado com sucesso e todos os serviços estão prontos!"
            Write-Host ""
            Write-Host "URLs de acesso:"
            Write-Host "  ${GREEN}Frontend:${RESET}  http://localhost:3100"
            Write-Host "  ${GREEN}Backend:${RESET}   http://localhost:3101"
            Write-Host "  ${GREEN}API Docs:${RESET}  http://localhost:3101/api/docs"
            Write-Host "  ${CYAN}PgAdmin:${RESET}   http://localhost:5150 (dev profile)"
            Write-Host "  ${CYAN}Redis UI:${RESET}  http://localhost:8181 (dev profile)"
            Write-Host ""
        } else {
            Write-Host ""
            Print-Warning "Sistema iniciou mas alguns serviços podem não estar prontos"
            Print-Info "Verifique o status: .\system-manager.ps1 status"
            Print-Info "Verifique os logs: .\system-manager.ps1 logs <service>"
            Write-Host ""
        }
    } else {
        Print-Error "Erro ao iniciar serviços"
        Print-Info "Verifique os logs: .\system-manager.ps1 logs"
    }
}

# Stop system
function Stop-System {
    Print-Header "Parando Sistema"

    Print-Info "Parando todos os serviços..."
    docker-compose down

    if ($LASTEXITCODE -eq 0) {
        Print-Success "Todos os serviços foram parados!"
    } else {
        Print-Error "Erro ao parar serviços"
    }
}

# Restart system
function Restart-System {
    Print-Header "Reiniciando Sistema"

    Stop-System
    Start-Sleep -Seconds 3
    Start-System
}

# Get system status
function Get-SystemStatus {
    Print-Header "Status do Sistema"

    docker-compose ps

    Write-Host ""

    # Check service health
    $services = @("postgres", "redis", "backend", "frontend", "scrapers")

    foreach ($service in $services) {
        $status = docker-compose ps -q $service
        if ($status) {
            $health = docker inspect --format='{{.State.Health.Status}}' "invest_$service" 2>$null
            if ($health -eq "healthy") {
                Print-Success "$service está saudável"
            } elseif ($health) {
                Print-Warning "$service está $health"
            } else {
                Print-Info "$service está rodando (sem health check)"
            }
        } else {
            Print-Error "$service não está rodando"
        }
    }
}

# Quick health check
function Get-HealthCheck {
    Write-Host ""
    Write-Host "🏥 Health Check Rápido"
    Write-Host "======================="
    Write-Host ""

    # Check PostgreSQL
    $pgStatus = docker-compose exec -T postgres pg_isready -U invest_user -d invest_db 2>$null
    if ($LASTEXITCODE -eq 0) {
        Print-Success "PostgreSQL: OK"
    } else {
        Print-Error "PostgreSQL: FALHOU"
    }

    # Check Redis
    $redisStatus = docker-compose exec -T redis redis-cli ping 2>$null
    if ($redisStatus -match "PONG") {
        Print-Success "Redis: OK"
    } else {
        Print-Error "Redis: FALHOU"
    }

    # Check Backend
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3101/health" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Print-Success "Backend: OK"
        } else {
            Print-Warning "Backend: Resposta inesperada ($($response.StatusCode))"
        }
    } catch {
        Print-Error "Backend: FALHOU"
    }

    # Check Frontend
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3100" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Print-Success "Frontend: OK"
        } else {
            Print-Warning "Frontend: Resposta inesperada ($($response.StatusCode))"
        }
    } catch {
        Print-Error "Frontend: FALHOU"
    }
}

# View logs
function Get-Logs {
    param([string]$Service, [int]$Lines = 100)

    if ($Service) {
        Print-Info "Mostrando logs de $Service (últimas $Lines linhas)..."
        docker-compose logs --tail=$Lines -f $Service
    } else {
        Print-Info "Mostrando logs de todos os serviços (últimas $Lines linhas)..."
        docker-compose logs --tail=$Lines -f
    }
}

# Clean system
function Clear-System {
    Print-Header "Limpando Sistema"

    Print-Warning "ATENÇÃO: Isso irá remover TODOS os dados (banco de dados, cache, volumes)!"
    $confirm = Read-Host "Tem certeza que deseja continuar? Digite 'CONFIRMAR' para prosseguir"

    if ($confirm -eq "CONFIRMAR") {
        Print-Info "Parando serviços..."
        docker-compose down

        Print-Info "Removendo volumes..."
        docker-compose down -v

        Print-Info "Removendo imagens personalizadas..."
        docker rmi invest_backend invest_frontend invest_scrapers 2>$null

        Print-Success "Sistema limpo!"
    } else {
        Print-Info "Operação cancelada"
    }
}

# Show help
function Show-Help {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════╗"
    Write-Host "║   B3 AI Analysis Platform - System Manager            ║"
    Write-Host "╚════════════════════════════════════════════════════════╝"
    Write-Host ""
    Write-Host "Uso: .\system-manager.ps1 <comando> [opções]"
    Write-Host ""
    Write-Host "Comandos disponíveis:"
    Write-Host ""
    Write-Host "  ${GREEN}start${RESET}              Inicia o sistema completo com verificações inteligentes"
    Write-Host "  ${RED}stop${RESET}               Para todos os serviços"
    Write-Host "  ${YELLOW}restart${RESET}            Reinicia o sistema completo"
    Write-Host "  ${BLUE}status${RESET}             Mostra o status detalhado de todos os serviços"
    Write-Host "  ${CYAN}health${RESET}             Health check rápido de todos os serviços"
    Write-Host "  ${GREEN}install${RESET}            Instala/atualiza dependências (npm)"
    Write-Host "  ${GREEN}build${RESET}              Faz build das imagens Docker"
    Write-Host "  ${BLUE}logs [service]${RESET}     Mostra logs (opcional: especificar serviço)"
    Write-Host "  ${RED}clean${RESET}              Remove todos os dados e volumes (CUIDADO!)"
    Write-Host "  ${BLUE}help${RESET}               Mostra esta mensagem de ajuda"
    Write-Host ""
    Write-Host "Exemplos:"
    Write-Host "  .\system-manager.ps1 start"
    Write-Host "  .\system-manager.ps1 logs backend"
    Write-Host "  .\system-manager.ps1 health"
    Write-Host ""
    Write-Host "Serviços disponíveis:"
    Write-Host "  - postgres      (Banco de dados PostgreSQL + TimescaleDB)"
    Write-Host "  - redis         (Cache e filas)"
    Write-Host "  - backend       (API NestJS)"
    Write-Host "  - frontend      (Interface Next.js)"
    Write-Host "  - scrapers      (Coletores Python)"
    Write-Host "  - pgadmin       (Admin do PostgreSQL - profile dev)"
    Write-Host "  - redis-commander (Admin do Redis - profile dev)"
    Write-Host ""
}

# Main script logic
$command = $args[0]
$param = $args[1]

switch ($command) {
    "start" { Start-System }
    "stop" { Stop-System }
    "restart" { Restart-System }
    "status" { Get-SystemStatus }
    "health" { Get-HealthCheck }
    "install" { Install-Dependencies }
    "build" { Build-DockerImages }
    "logs" { Get-Logs -Service $param }
    "clean" { Clear-System }
    "help" { Show-Help }
    default {
        if ($command) {
            Print-Error "Comando desconhecido: $command"
        }
        Show-Help
    }
}
