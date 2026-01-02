# B3 AI Analysis Platform - System Manager (PowerShell)
# This script manages the entire system lifecycle with intelligent checks
# Version 2.0 - Full 11-service support with profiles

# ============================================
# Service Configuration
# ============================================

# Core services (always managed)
$CoreServices = @("postgres", "redis", "python-service", "backend", "frontend", "scrapers", "api-service")

# Profile-specific services
$DevServices = @("pgadmin", "redis-commander")
$ProdServices = @("nginx")

# Container name mapping
$ContainerMap = @{
    "postgres"         = @{ Container = "invest_postgres"; Port = 5532; HealthType = "pg_isready"; Endpoint = $null }
    "redis"            = @{ Container = "invest_redis"; Port = 6479; HealthType = "redis-cli"; Endpoint = $null }
    "python-service"   = @{ Container = "invest_python_service"; Port = 8001; HealthType = "http"; Endpoint = "/health" }
    "backend"          = @{ Container = "invest_backend"; Port = 3101; HealthType = "http"; Endpoint = "/api/v1/health" }
    "frontend"         = @{ Container = "invest_frontend"; Port = 3100; HealthType = "http"; Endpoint = "/" }
    "scrapers"         = @{ Container = "invest_scrapers"; Port = 5900; HealthType = "docker"; Endpoint = $null }
    "api-service"      = @{ Container = "invest_api_service"; Port = 8000; HealthType = "http"; Endpoint = "/health"; NetworkMode = "scrapers" }
    "nginx"            = @{ Container = "invest_nginx"; Port = 80; HealthType = "http"; Endpoint = "/"; Profile = "production" }
    "pgadmin"          = @{ Container = "invest_pgadmin"; Port = 5150; HealthType = "http"; Endpoint = "/"; Profile = "dev" }
    "redis-commander"  = @{ Container = "invest_redis_commander"; Port = 8181; HealthType = "http"; Endpoint = "/"; Profile = "dev" }
}

# Service dependencies (for smart restart)
$ServiceDependencies = @{
    "scrapers" = @("api-service")  # api-service uses network_mode: service:scrapers
    "postgres" = @("backend", "scrapers", "api-service")
    "redis"    = @("backend", "scrapers")
}

# ============================================
# Colors for output
# ============================================
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
    Write-Host "${BLUE}[i]${RESET} $Message"
}

function Print-Success {
    param([string]$Message)
    Write-Host "${GREEN}[OK]${RESET} $Message"
}

function Print-Warning {
    param([string]$Message)
    Write-Host "${YELLOW}[!]${RESET} $Message"
}

function Print-Error {
    param([string]$Message)
    Write-Host "${RED}[X]${RESET} $Message"
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
        [array]$Services = $CoreServices
    )

    Print-Info "Aguardando serviços ficarem prontos (timeout: ${MaxWaitSeconds}s)..."

    $waited = 0
    $checkInterval = 5

    while ($waited -lt $MaxWaitSeconds) {
        $allHealthy = $true
        $statusMessages = @()

        foreach ($service in $Services) {
            # Use ContainerMap to get correct container name (handles python-service -> invest_python_service)
            $containerName = if ($ContainerMap.ContainsKey($service)) { $ContainerMap[$service].Container } else { "invest_$service" }

            try {
                # Check if container exists and is running
                $containerState = docker inspect --format='{{.State.Status}}' $containerName 2>$null

                if ($containerState -ne "running") {
                    $allHealthy = $false
                    $statusMessages += "${YELLOW}[...]${RESET} $service (nao rodando)"
                    continue
                }

                # Check health status
                $health = docker inspect --format='{{.State.Health.Status}}' $containerName 2>$null

                if ($health -eq "healthy") {
                    $statusMessages += "${GREEN}[OK]${RESET} $service"
                } elseif ($health -eq "starting") {
                    $allHealthy = $false
                    $statusMessages += "${YELLOW}[...]${RESET} $service (iniciando)"
                } elseif ($health -eq "unhealthy") {
                    $allHealthy = $false
                    $statusMessages += "${RED}[X]${RESET} $service (nao saudavel)"
                } else {
                    # No health check defined, just check if running
                    $statusMessages += "${CYAN}[i]${RESET} $service (sem health check)"
                }
            } catch {
                $allHealthy = $false
                $statusMessages += "${RED}[X]${RESET} $service (erro: $_)"
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

# Check and create environment files
function Test-EnvironmentFiles {
    Print-Header "Verificando Arquivos de Ambiente"

    $needsSetup = $false

    # Check backend .env
    if (-not (Test-Path "backend/.env")) {
        Print-Warning "Arquivo backend/.env não encontrado"

        if (Test-Path "backend/.env.example") {
            Print-Info "Criando backend/.env a partir do .env.example..."
            Copy-Item "backend/.env.example" "backend/.env"
            Print-Success "Arquivo backend/.env criado!"
            Print-Warning "IMPORTANTE: Configure suas credenciais em backend/.env se necessário"
            $needsSetup = $true
        } else {
            Print-Error "Arquivo backend/.env.example não encontrado!"
            return $false
        }
    } else {
        Print-Success "Arquivo backend/.env encontrado"
    }

    # Check frontend .env
    if (-not (Test-Path "frontend/.env")) {
        Print-Warning "Arquivo frontend/.env não encontrado"

        if (Test-Path "frontend/.env.example") {
            Print-Info "Criando frontend/.env a partir do .env.example..."
            Copy-Item "frontend/.env.example" "frontend/.env"
            Print-Success "Arquivo frontend/.env criado!"
        }
    } else {
        Print-Success "Arquivo frontend/.env encontrado"
    }

    if ($needsSetup) {
        Write-Host ""
        Print-Info "Arquivos .env foram criados. Pressione ENTER para continuar..."
        Read-Host
    }

    return $true
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

# Run database migrations
function Invoke-Migrations {
    Print-Header "Executando Migrações do Banco de Dados"

    # Check if backend container is running
    $backendRunning = docker-compose ps -q backend 2>$null
    if (-not $backendRunning) {
        Print-Error "Container do backend não está rodando"
        Print-Info "Inicie o sistema primeiro: .\system-manager.ps1 start"
        return $false
    }

    Print-Info "Aguardando backend ficar pronto..."
    Start-Sleep -Seconds 5

    Print-Info "Executando migrações..."
    docker-compose exec -T backend npm run migration:run

    if ($LASTEXITCODE -eq 0) {
        Print-Success "Migrações executadas com sucesso!"
        return $true
    } else {
        Print-Warning "Não foi possível executar migrações (pode já estar atualizado)"
        return $false
    }
}

# Clean containers and volumes
function Clean-Containers {
    param(
        [bool]$Force = $false
    )

    Print-Header "Limpando Containers e Volumes"

    # Check if there are running containers
    $runningContainers = docker ps -q --filter "name=invest_" 2>$null
    $stoppedContainers = docker ps -aq --filter "name=invest_" 2>$null

    if (-not $Force -and ($runningContainers -or $stoppedContainers)) {
        Print-Warning "Esta operação irá:"
        Write-Host "  • Parar todos os containers"
        Write-Host "  • Remover todos os containers"
        Write-Host "  • Remover todos os volumes (banco de dados será LIMPO)"
        Write-Host "  • Remover redes"
        Write-Host ""
        $confirm = Read-Host "Tem certeza? (y/n)"
        if ($confirm -ne "y") {
            Print-Info "Operação cancelada"
            return $false
        }
    }

    Print-Info "Parando e removendo containers, volumes e redes..."
    docker-compose down -v 2>&1 | Out-Null

    if ($LASTEXITCODE -eq 0) {
        Print-Success "Containers, volumes e redes removidos com sucesso!"
        return $true
    } else {
        Print-Error "Erro ao limpar containers"
        return $false
    }
}

# Start system
function Start-System {
    param([bool]$VerboseMode = $false)

    Print-Header "Iniciando Sistema B3 AI Analysis Platform"
    
    if ($VerboseMode) {
        Print-Warning "MODO VERBOSE ATIVADO: Logs serão exibidos em tempo real."
        Print-Warning "Pressione Ctrl+C para parar os logs (os containers continuarão rodando se usar -d, mas neste modo rodaremos em foreground)."
    }

    # Check and create environment files
    if (-not (Test-EnvironmentFiles)) {
        Print-Error "Erro ao configurar arquivos de ambiente. Corrija os problemas antes de continuar."
        return
    }

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

    # Check if there are containers with errors or unhealthy status
    $problemContainers = docker ps -a --filter "name=invest_" --format "{{.Names}}: {{.Status}}" | Select-String -Pattern "(unhealthy|Exited|Error)"

    if ($problemContainers) {
        Write-Host ""
        Print-Warning "Containers com problemas detectados:"
        $problemContainers | ForEach-Object { Write-Host "  $_" }
        Write-Host ""
        Print-Warning "Recomendado limpar containers antigos antes de iniciar"
        $clean = Read-Host "Deseja limpar containers e volumes agora? (y/n)"
        if ($clean -eq "y") {
            Clean-Containers -Force $true
            Write-Host ""
        }
    }

    # Check for updates
    $codeUpdated = Test-Updates

    # Check dependencies
    $depsChanged = Test-Dependencies

    # Check Docker images
    $imagesChanged = Test-DockerImages

    # Suggest rebuild if needed
    if ($codeUpdated -or $depsChanged -or $imagesChanged) {
        Print-Warning "Código, dependências ou imagens foram atualizados"
        $rebuild = Read-Host "Deseja fazer rebuild das imagens Docker? (y/n)"
        if ($rebuild -eq "y") {
            Build-DockerImages
        }
    }

    # Start services
    Print-Header "Iniciando Serviços Docker"
    Print-Info "Iniciando containers..."

    # Start services
    Print-Header "Iniciando Serviços Docker"
    Print-Info "Iniciando containers..."

    if ($VerboseMode) {
        # Em modo verbose, rodamos sem -d para ver os logs imediatamente
        # Mas isso significa que o script vai parar aqui até o usuário cancelar
        Print-Info "Executando em modo foreground (logs em tempo real)..."
        docker-compose up
        
        # Se o usuário cancelar (Ctrl+C), o docker-compose up para os containers.
        # Então não fazemos health check depois.
        return
    }

    docker-compose up -d

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""

        # Wait for services to be healthy (with real health checks)
        $isHealthy = Wait-ForHealthy -MaxWaitSeconds 120

        if ($isHealthy) {
            # Run database migrations automatically
            Write-Host ""
            Invoke-Migrations

            # Show URLs
            Write-Host ""
            Print-Success "Sistema iniciado com sucesso e todos os serviços estão prontos!"
            Write-Host ""
            Write-Host "URLs de acesso:"
            Write-Host ""
            Write-Host "  ${GREEN}Frontend:${RESET}       http://localhost:3100"
            Write-Host "  ${GREEN}Backend API:${RESET}    http://localhost:3101/api/v1"
            Write-Host "  ${GREEN}API Docs:${RESET}       http://localhost:3101/api/docs"
            Write-Host ""
            Write-Host "  ${CYAN}API Service:${RESET}    http://localhost:8000"
            Write-Host "  ${CYAN}Python Svc:${RESET}     http://localhost:8001"
            Write-Host "  ${CYAN}OAuth API:${RESET}      http://localhost:8080/api/oauth"
            Write-Host ""
            Write-Host "  ${YELLOW}noVNC:${RESET}          http://localhost:6080"
            Write-Host "  ${YELLOW}VNC Direct:${RESET}     vnc://localhost:5900"
            Write-Host ""
            Write-Host "  ${MAGENTA}PgAdmin:${RESET}        http://localhost:5150 (use start-dev)"
            Write-Host "  ${MAGENTA}Redis UI:${RESET}       http://localhost:8181 (use start-dev)"
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
    Print-Header "Core Services"

    # Check core service health
    foreach ($service in $CoreServices) {
        $containerName = $ContainerMap[$service].Container
        $status = docker ps -q --filter "name=$containerName" 2>$null
        if ($status) {
            $health = docker inspect --format='{{.State.Health.Status}}' $containerName 2>$null
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

    # Check dev profile services
    Write-Host ""
    Print-Info "Dev Profile Services:"
    foreach ($service in $DevServices) {
        $containerName = $ContainerMap[$service].Container
        $status = docker ps -q --filter "name=$containerName" 2>$null
        if ($status) {
            $health = docker inspect --format='{{.State.Health.Status}}' $containerName 2>$null
            if ($health -eq "healthy") {
                Print-Success "$service está saudável"
            } elseif ($health) {
                Print-Warning "$service está $health"
            } else {
                Print-Info "$service está rodando"
            }
        } else {
            Print-Info "$service não ativo (use start-dev para ativar)"
        }
    }

    # Check production profile services
    Write-Host ""
    Print-Info "Production Profile Services:"
    foreach ($service in $ProdServices) {
        $containerName = $ContainerMap[$service].Container
        $status = docker ps -q --filter "name=$containerName" 2>$null
        if ($status) {
            Print-Success "$service está rodando"
        } else {
            Print-Info "$service não ativo (use start-prod para ativar)"
        }
    }
}

# Quick health check
function Get-HealthCheck {
    Write-Host ""
    Write-Host "[+] Health Check Completo"
    Write-Host "========================="
    Write-Host ""

    Print-Info "Core Infrastructure:"

    # Check PostgreSQL
    docker-compose exec -T postgres pg_isready -U invest_user -d invest_db 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Print-Success "PostgreSQL (5532): OK"
    } else {
        Print-Error "PostgreSQL (5532): FALHOU"
    }

    # Check Redis
    $redisStatus = docker-compose exec -T redis redis-cli ping 2>$null
    if ($redisStatus -match "PONG") {
        Print-Success "Redis (6479): OK"
    } else {
        Print-Error "Redis (6479): FALHOU"
    }

    Write-Host ""
    Print-Info "Backend Services:"

    # Check Python Service
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:8001/health" -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Print-Success "Python Service (8001): OK"
        } else {
            Print-Warning "Python Service (8001): Resposta inesperada ($($response.StatusCode))"
        }
    } catch {
        Print-Error "Python Service (8001): FALHOU"
    }

    # Check Backend
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:3101/api/v1/health" -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Print-Success "Backend API (3101): OK"
        } else {
            Print-Warning "Backend API (3101): Resposta inesperada ($($response.StatusCode))"
        }
    } catch {
        Print-Error "Backend API (3101): FALHOU"
    }

    # Check API Service (via scrapers network)
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/health" -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Print-Success "API Service (8000): OK"
        } else {
            Print-Warning "API Service (8000): Resposta inesperada ($($response.StatusCode))"
        }
    } catch {
        Print-Error "API Service (8000): FALHOU"
    }

    Write-Host ""
    Print-Info "Frontend Services:"

    # Check Frontend (Next.js returns 307 redirect for auth, which is OK)
    # Use Docker health check status instead of HTTP for more reliability
    $frontendHealth = docker inspect --format='{{.State.Health.Status}}' invest_frontend 2>$null
    if ($frontendHealth -eq "healthy") {
        Print-Success "Frontend (3100): OK (healthy)"
    } elseif ($frontendHealth) {
        Print-Warning "Frontend (3100): $frontendHealth"
    } else {
        # Fallback to HTTP check
        try {
            $response = Invoke-WebRequest -Uri "http://127.0.0.1:3100" -TimeoutSec 10 -UseBasicParsing
            Print-Success "Frontend (3100): OK"
        } catch {
            Print-Error "Frontend (3100): FALHOU"
        }
    }

    Write-Host ""
    Print-Info "Scraper Services:"

    # Check Scrapers container
    $scrapersHealth = docker inspect --format='{{.State.Health.Status}}' invest_scrapers 2>$null
    if ($scrapersHealth -eq "healthy") {
        Print-Success "Scrapers Container: OK (healthy)"
    } elseif ($scrapersHealth) {
        Print-Warning "Scrapers Container: $scrapersHealth"
    } else {
        Print-Warning "Scrapers Container: Não encontrado"
    }

    # Check OAuth API
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:8080/api/oauth/health" -TimeoutSec 10 -UseBasicParsing
        Print-Success "OAuth API (8080): OK"
    } catch {
        Print-Warning "OAuth API (8080): Não disponível"
    }

    # Check noVNC
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:6080" -TimeoutSec 10 -UseBasicParsing
        Print-Success "noVNC Web (6080): OK"
    } catch {
        Print-Warning "noVNC Web (6080): Não disponível"
    }

    Write-Host ""
    Print-Info "Dev Profile Services:"

    # Check PgAdmin (if running)
    $pgadminRunning = docker ps -q --filter "name=invest_pgadmin" 2>$null
    if ($pgadminRunning) {
        try {
            $response = Invoke-WebRequest -Uri "http://127.0.0.1:5150" -TimeoutSec 10 -UseBasicParsing
            Print-Success "PgAdmin (5150): OK"
        } catch {
            Print-Warning "PgAdmin (5150): Container rodando mas não responde"
        }
    } else {
        Print-Info "PgAdmin (5150): Não ativo (use start-dev)"
    }

    # Check Redis Commander (if running)
    $redisCommRunning = docker ps -q --filter "name=invest_redis_commander" 2>$null
    if ($redisCommRunning) {
        try {
            $response = Invoke-WebRequest -Uri "http://127.0.0.1:8181" -TimeoutSec 10 -UseBasicParsing
            Print-Success "Redis Commander (8181): OK"
        } catch {
            Print-Warning "Redis Commander (8181): Container rodando mas não responde"
        }
    } else {
        Print-Info "Redis Commander (8181): Não ativo (use start-dev)"
    }

    Write-Host ""
    Print-Info "Production Profile Services:"

    # Check Nginx (if running)
    $nginxRunning = docker ps -q --filter "name=invest_nginx" 2>$null
    if ($nginxRunning) {
        try {
            # Nginx returns 301 redirect to HTTPS, which is valid
            $response = Invoke-WebRequest -Uri "http://127.0.0.1:80" -TimeoutSec 10 -UseBasicParsing -MaximumRedirection 0 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 301 -or $response.StatusCode -eq 302) {
                Print-Success "Nginx (80/443): OK"
            } else {
                Print-Warning "Nginx: HTTP $($response.StatusCode)"
            }
        } catch [System.Net.WebException] {
            # 301/302 throws WebException in PowerShell 5.1, check if it's a redirect
            if ($_.Exception.Response -and $_.Exception.Response.StatusCode -match "Moved|Redirect|301|302") {
                Print-Success "Nginx (80/443): OK (redirect to HTTPS)"
            } else {
                Print-Warning "Nginx: Container rodando mas não responde"
            }
        } catch {
            Print-Warning "Nginx: Container rodando mas não responde"
        }
    } else {
        Print-Info "Nginx: Não ativo (use start-prod)"
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
    Print-Info "DICA: Se você quer apenas resolver problemas de cache/build, use 'clean-cache' ou 'rebuild-frontend'."
    $confirm = Read-Host "Tem certeza que deseja continuar? Digite 'CONFIRMAR' para prosseguir"

    if ($confirm -eq "CONFIRMAR") {
        # Use Clean-Containers to remove containers and volumes
        Clean-Containers -Force $true

        Print-Info "Removendo imagens personalizadas..."
        docker rmi invest-claude-web-backend invest-claude-web-frontend invest-claude-web-scrapers 2>$null | Out-Null

        Print-Success "Sistema limpo completamente!"
        Write-Host ""
        Print-Info "Para iniciar novamente: .\system-manager.ps1 start"
    } else {
        Print-Info "Operação cancelada"
    }
}

# Backup Database
function Backup-Database {
    Print-Header "Backup do Banco de Dados"

    if (-not (Test-Path "backups")) {
        New-Item -ItemType Directory -Force -Path "backups" | Out-Null
    }

    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $filename = "invest_db_$timestamp.sql"
    $filepath = "backups/$filename"

    Print-Info "Criando backup em $filepath..."
    
    # Check if postgres container is running
    if (-not (docker ps -q -f name=invest_postgres)) {
        Print-Error "Container invest_postgres não está rodando!"
        return
    }

    docker exec -t invest_postgres pg_dump -U invest_user invest_db > $filepath

    if ($LASTEXITCODE -eq 0) {
        Print-Success "Backup criado com sucesso: $filepath"
    } else {
        Print-Error "Erro ao criar backup"
    }
}

# Restore Database
function Restore-Database {
    Print-Header "Restaurar Banco de Dados"

    if (-not (Test-Path "backups")) {
        Print-Error "Diretório 'backups' não encontrado."
        return
    }

    $backups = Get-ChildItem "backups/*.sql" | Sort-Object LastWriteTime -Descending

    if (-not $backups) {
        Print-Warning "Nenhum arquivo de backup encontrado em 'backups/'."
        return
    }

    Write-Host "Backups disponíveis:"
    $i = 1
    foreach ($backup in $backups) {
        Write-Host "  [$i] $($backup.Name) ($($backup.LastWriteTime))"
        $i++
    }
    Write-Host ""

    $selection = Read-Host "Selecione o número do backup para restaurar (0 para cancelar)"
    
    if ($selection -match "^\d+$" -and $selection -gt 0 -and $selection -le $backups.Count) {
        $selectedBackup = $backups[$selection - 1]
        
        Write-Host ""
        Print-Warning "ATENÇÃO: Isso irá SOBRESCREVER todo o banco de dados atual!"
        Print-Warning "Arquivo selecionado: $($selectedBackup.Name)"
        $confirm = Read-Host "Digite 'RESTAURAR' para confirmar"

        if ($confirm -eq "RESTAURAR") {
            Print-Info "Restaurando banco de dados..."
            
            # Check if postgres container is running
            if (-not (docker ps -q -f name=invest_postgres)) {
                Print-Error "Container invest_postgres não está rodando!"
                return
            }
            
            Get-Content $selectedBackup.FullName | docker exec -i invest_postgres psql -U invest_user invest_db

            if ($LASTEXITCODE -eq 0) {
                Print-Success "Banco de dados restaurado com sucesso!"
            } else {
                Print-Error "Erro ao restaurar banco de dados"
            }
        } else {
            Print-Info "Operação cancelada."
        }
    } else {
        Print-Info "Operação cancelada."
    }
}

# Restart a single service with dependency awareness
function Restart-SingleService {
    param([string]$ServiceName)

    if (-not $ServiceName) {
        Print-Error "Especifique o serviço: .\system-manager.ps1 restart-service <nome>"
        Write-Host ""
        Print-Info "Serviços disponíveis:"
        Write-Host "  Core: $($CoreServices -join ', ')"
        Write-Host "  Dev:  $($DevServices -join ', ')"
        Write-Host "  Prod: $($ProdServices -join ', ')"
        return
    }

    # Validate service name
    $allServices = $CoreServices + $DevServices + $ProdServices
    if ($ServiceName -notin $allServices) {
        Print-Error "Serviço '$ServiceName' não encontrado"
        Write-Host ""
        Print-Info "Serviços disponíveis:"
        Write-Host "  Core: $($CoreServices -join ', ')"
        Write-Host "  Dev:  $($DevServices -join ', ')"
        Write-Host "  Prod: $($ProdServices -join ', ')"
        return
    }

    Print-Header "Reiniciando Serviço: $ServiceName"

    # Check for dependent services
    $dependents = $ServiceDependencies[$ServiceName]
    if ($dependents) {
        Print-Warning "Este serviço tem dependentes: $($dependents -join ', ')"
        Print-Info "Eles também serão reiniciados para manter consistência."
        Write-Host ""

        # Restart all together
        $servicesToRestart = @($ServiceName) + $dependents
        Print-Info "Reiniciando: $($servicesToRestart -join ', ')..."
        docker-compose restart $servicesToRestart

        if ($LASTEXITCODE -eq 0) {
            Print-Success "Serviços reiniciados com sucesso!"
        } else {
            Print-Error "Erro ao reiniciar serviços"
        }
    } else {
        Print-Info "Reiniciando $ServiceName..."
        docker-compose restart $ServiceName

        if ($LASTEXITCODE -eq 0) {
            Print-Success "$ServiceName reiniciado com sucesso!"
        } else {
            Print-Error "Erro ao reiniciar $ServiceName"
        }
    }
}

# Start with dev profile (includes pgadmin, redis-commander)
function Start-Dev {
    Print-Header "Iniciando Sistema com Profile DEV"
    Print-Info "Isso inclui: pgadmin, redis-commander"
    Write-Host ""

    # Check prerequisites
    if (-not (Test-Prerequisites)) {
        Print-Error "Pré-requisitos não atendidos. Corrija os problemas antes de continuar."
        return
    }

    # Start core + dev services
    Print-Info "Iniciando core services + dev tools..."
    docker-compose --profile dev up -d

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""

        # Wait for core services
        $isHealthy = Wait-ForHealthy -MaxWaitSeconds 120

        if ($isHealthy) {
            Write-Host ""
            Print-Success "Sistema DEV iniciado com sucesso!"
            Write-Host ""
            Write-Host "URLs de acesso:"
            Write-Host "  ${GREEN}Frontend:${RESET}       http://localhost:3100"
            Write-Host "  ${GREEN}Backend API:${RESET}    http://localhost:3101/api/v1"
            Write-Host "  ${GREEN}API Docs:${RESET}       http://localhost:3101/api/docs"
            Write-Host "  ${CYAN}API Service:${RESET}    http://localhost:8000"
            Write-Host "  ${CYAN}Python Svc:${RESET}     http://localhost:8001"
            Write-Host "  ${YELLOW}noVNC:${RESET}          http://localhost:6080"
            Write-Host ""
            Write-Host "  ${MAGENTA}PgAdmin:${RESET}        http://localhost:5150"
            Write-Host "  ${MAGENTA}Redis UI:${RESET}       http://localhost:8181"
            Write-Host ""
        } else {
            Print-Warning "Sistema iniciou mas alguns serviços podem não estar prontos"
            Print-Info "Verifique: .\system-manager.ps1 health"
        }
    } else {
        Print-Error "Erro ao iniciar serviços DEV"
    }
}

# Start with production profile (includes nginx)
function Start-Production {
    Print-Header "Iniciando Sistema com Profile PRODUCTION"
    Print-Info "Isso inclui: nginx (reverse proxy)"
    Write-Host ""

    # Check prerequisites
    if (-not (Test-Prerequisites)) {
        Print-Error "Pré-requisitos não atendidos. Corrija os problemas antes de continuar."
        return
    }

    # Start core + production services
    Print-Info "Iniciando core services + nginx..."
    docker-compose --profile production up -d

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""

        # Wait for core services
        $isHealthy = Wait-ForHealthy -MaxWaitSeconds 120

        if ($isHealthy) {
            Write-Host ""
            Print-Success "Sistema PRODUCTION iniciado com sucesso!"
            Write-Host ""
            Write-Host "URLs de acesso (via Nginx):"
            Write-Host "  ${GREEN}HTTP:${RESET}   http://localhost:80"
            Write-Host "  ${GREEN}HTTPS:${RESET}  https://localhost:443"
            Write-Host ""
            Write-Host "URLs diretas (bypass nginx):"
            Write-Host "  ${CYAN}Frontend:${RESET}   http://localhost:3100"
            Write-Host "  ${CYAN}Backend:${RESET}    http://localhost:3101/api/v1"
            Write-Host ""
        } else {
            Print-Warning "Sistema iniciou mas alguns serviços podem não estar prontos"
            Print-Info "Verifique: .\system-manager.ps1 health"
        }
    } else {
        Print-Error "Erro ao iniciar serviços PRODUCTION"
    }
}

# Get Docker volumes status
function Get-Volumes {
    Print-Header "Volumes Docker do Projeto"

    $projectVolumes = @(
        @{ Name = "invest-claude-web_postgres_data"; Description = "Dados do PostgreSQL" },
        @{ Name = "invest-claude-web_redis_data"; Description = "Dados do Redis" },
        @{ Name = "invest-claude-web_backend_node_modules"; Description = "Dependências Backend" },
        @{ Name = "invest-claude-web_frontend_node_modules"; Description = "Dependências Frontend" },
        @{ Name = "invest-claude-web_pgadmin_data"; Description = "Configurações PgAdmin" },
        @{ Name = "invest-claude-web_x11_socket"; Description = "Socket X11 (scrapers)" }
    )

    $existingVolumes = docker volume ls -q 2>$null

    foreach ($vol in $projectVolumes) {
        if ($existingVolumes -contains $vol.Name) {
            Print-Success "$($vol.Name)"
            Print-Info "  -> $($vol.Description)"
        } else {
            Print-Warning "$($vol.Name) - NÃO EXISTE"
            Print-Info "  -> $($vol.Description)"
        }
    }

    Write-Host ""
    Print-Info "Para ver uso de espaço: docker system df -v"
}

# Get Docker network status
function Get-Network {
    Print-Header "Rede Docker do Projeto"

    $networkName = "invest-claude-web_invest_network"

    $networkExists = docker network ls -q --filter "name=$networkName" 2>$null
    if ($networkExists) {
        Print-Success "Rede $networkName existe"

        Write-Host ""
        Print-Info "Containers conectados:"

        $networkInfo = docker network inspect $networkName 2>$null | ConvertFrom-Json
        $containers = $networkInfo.Containers

        if ($containers) {
            $containers.PSObject.Properties | ForEach-Object {
                $containerInfo = $_.Value
                Write-Host "  - $($containerInfo.Name): $($containerInfo.IPv4Address)"
            }
        } else {
            Print-Warning "Nenhum container conectado"
        }
    } else {
        Print-Warning "Rede $networkName não existe"
        Print-Info "Execute 'start' para criar a rede automaticamente"
    }
}

# Clean Cache (Safe)
function Clean-Cache {
    Print-Header "Limpeza de Cache (Segura)"

    Print-Info "Parando frontend..."
    docker stop invest_frontend 2>$null

    Print-Info "Removendo volume de cache do Next.js..."
    docker volume rm invest-claude-web_frontend_next 2>$null

    Print-Success "Cache do frontend limpo!"
    
    $cleanDeps = Read-Host "Deseja remover também node_modules (backend/frontend)? (y/n)"
    if ($cleanDeps -eq "y") {
        Print-Info "Removendo volumes de dependências..."
        docker volume rm invest-claude-web_backend_node_modules 2>$null
        docker volume rm invest-claude-web_frontend_node_modules 2>$null
        Print-Success "Dependências removidas. Execute 'install' para reinstalar."
    }

    Print-Info "Execute 'start' ou 'rebuild-frontend' para iniciar novamente."
}

# Rebuild Frontend (simple - may NOT clear Turbopack in-memory cache)
function Rebuild-Frontend {
    Print-Header "Rebuild Frontend"

    Clean-Cache

    Print-Info "Iniciando frontend com rebuild..."
    docker-compose up -d --build frontend

    if ($LASTEXITCODE -eq 0) {
        Print-Success "Frontend reiniciado com sucesso!"
    } else {
        Print-Error "Erro ao reiniciar frontend"
    }
}

# Rebuild Frontend Complete (KILLS Turbopack in-memory cache)
# Use this when components are not rendering despite code being correct
# Root cause: Next.js 16 + Turbopack keeps compiled modules in Node.js process memory
# Solution: docker rm (kills process) instead of docker restart (suspends/resumes)
function Rebuild-FrontendComplete {
    Print-Header "Full Frontend Rebuild (Kill Turbopack Cache)"

    Print-Warning "Este comando mata o processo Node.js para limpar cache in-memory do Turbopack."
    Print-Info "Use quando componentes novos nao aparecem mesmo com codigo correto."
    Write-Host ""

    # 1. Stop + Remove container (KILLS Node.js process = clears memory cache)
    Print-Info "Parando e removendo container (mata processo Turbopack)..."
    docker stop invest_frontend 2>$null
    docker rm invest_frontend 2>$null
    Print-Success "Processo Turbopack encerrado"

    # 2. Remove frontend volumes (compiled bundles)
    Print-Info "Removendo volumes do frontend..."
    docker volume rm invest-claude-web_frontend_node_modules 2>$null
    docker volume rm invest-claude-web_frontend_next 2>$null

    # 2b. CRITICAL: Remove anonymous volumes (includes .next cache)
    # docker-compose.yml uses "- /app/.next" which creates an ANONYMOUS volume
    # This volume persists Turbopack cache between rebuilds if not explicitly removed
    # Ref: BUG_CRITICO_TURBOPACK_MEMORY_CACHE.md
    Print-Info "Removendo volumes anonimos (cache .next do Turbopack)..."
    docker volume prune -f 2>$null
    Print-Success "Volumes removidos (incluindo anonimos)"

    # 3. Remove .next local (if exists)
    Print-Info "Removendo .next local..."
    if (Test-Path "frontend/.next") {
        Remove-Item -Recurse -Force "frontend/.next"
        Print-Success ".next local removido"
    } else {
        Print-Info ".next local nao existe (OK)"
    }

    # 4. Rebuild without cache
    Print-Info "Reconstruindo imagem sem cache..."
    docker-compose build --no-cache frontend

    if ($LASTEXITCODE -ne 0) {
        Print-Error "Erro ao fazer build do frontend"
        return
    }
    Print-Success "Build concluido"

    # 5. Start container
    Print-Info "Iniciando container..."
    docker-compose up -d frontend

    if ($LASTEXITCODE -ne 0) {
        Print-Error "Erro ao iniciar frontend"
        return
    }

    # 6. Wait for compilation
    Print-Info "Aguardando compilacao (45s)..."
    Start-Sleep -Seconds 45

    # 7. Verify health
    $health = docker inspect --format='{{.State.Health.Status}}' invest_frontend 2>$null
    if ($health -eq "healthy") {
        Print-Success "Frontend reconstruido e saudavel!"
    } else {
        Print-Warning "Frontend iniciado mas health check: $health"
        Print-Info "Verifique: docker logs invest_frontend --tail 20"
    }

    Write-Host ""
    Print-Success "Full rebuild completo! Valide no browser: http://localhost:3100"
}

# Clear Turbopack Cache (Fast version - FASE 148.4)
function Clear-TurbopackCache {
    Print-Header "Clear Turbopack In-Memory Cache"

    Print-Info "Este comando mata o processo Node.js para limpar cache in-memory."
    Print-Info "Mais rapido que 'rebuild-frontend-complete' (nao rebuilda imagem)."
    Write-Host ""

    # 1. Stop + Remove container (KILLS Node.js process = clears memory cache)
    Print-Info "Parando e removendo container..."
    docker stop invest_frontend 2>$null
    docker rm invest_frontend 2>$null
    Print-Success "Processo Turbopack encerrado"

    # 2. Start container (uses existing image)
    Print-Info "Iniciando container..."
    docker-compose up -d frontend

    if ($LASTEXITCODE -ne 0) {
        Print-Error "Erro ao iniciar frontend"
        return
    }

    # 3. Wait for compilation
    Print-Info "Aguardando compilacao (30s)..."
    Start-Sleep -Seconds 30

    # 4. Verify health
    $health = docker inspect --format='{{.State.Health.Status}}' invest_frontend 2>$null
    if ($health -eq "healthy") {
        Print-Success "Cache limpo e frontend saudavel!"
    } else {
        Print-Warning "Frontend iniciado mas health check: $health"
        Print-Info "Verifique: docker logs invest_frontend --tail 20"
    }

    Write-Host ""
    Print-Success "Cache Turbopack limpo! Valide no browser: http://localhost:3100"
    Print-Info "Se ainda nao funcionar, use 'rebuild-frontend-complete' para rebuild completo."
}

# Prune System
function Prune-System {
    Print-Header "Limpeza Profunda (Docker Prune)"
    
    Print-Warning "Isso irá remover:"
    Write-Host "  - Todos os containers parados"
    Write-Host "  - Todas as redes não usadas"
    Write-Host "  - Todas as imagens não usadas (dangling)"
    Write-Host "  - Cache de build"
    
    $confirm = Read-Host "Deseja continuar? (y/n)"
    if ($confirm -eq "y") {
        docker system prune -a
        Print-Success "Limpeza concluída!"
    }
}

# Check Types
function Check-Types {
    Print-Header "Verificação de Tipos (TypeScript)"

    # Backend
    if (Test-Path "backend") {
        Print-Info "Verificando Backend..."
        Push-Location backend
        if (Test-Path "node_modules") {
            npx tsc --noEmit
            if ($LASTEXITCODE -eq 0) {
                Print-Success "Backend: 0 erros"
            } else {
                Print-Error "Backend: Erros de tipo encontrados"
            }
        } else {
            Print-Warning "Backend: node_modules não encontrado (pulei verificação)"
        }
        Pop-Location
    }

    Write-Host ""

    # Frontend
    if (Test-Path "frontend") {
        Print-Info "Verificando Frontend..."
        Push-Location frontend
        if (Test-Path "node_modules") {
            npx tsc --noEmit
            if ($LASTEXITCODE -eq 0) {
                Print-Success "Frontend: 0 erros"
            } else {
                Print-Error "Frontend: Erros de tipo encontrados"
            }
        } else {
            Print-Warning "Frontend: node_modules não encontrado (pulei verificação)"
        }
        Pop-Location
    }
}

# Show help
function Show-Help {
    Write-Host ""
    Write-Host "============================================================"
    Write-Host "   B3 AI Analysis Platform - System Manager v2.0"
    Write-Host "   Full 11-service support with profiles"
    Write-Host "============================================================"
    Write-Host ""
    Write-Host "Uso: .\system-manager.ps1 COMANDO [opcoes]"
    Write-Host ""
    Write-Host "${GREEN}Comandos de Inicialização:${RESET}"
    Write-Host "  start              Inicia core services (8 serviços)"
    Write-Host "  start -Verbose     Inicia com logs em tempo real"
    Write-Host "  start-dev          Inicia com profile DEV (+ pgadmin, redis-commander)"
    Write-Host "  start-prod         Inicia com profile PRODUCTION (+ nginx)"
    Write-Host "  stop               Para todos os serviços"
    Write-Host "  restart            Reinicia o sistema completo"
    Write-Host "  restart-service    Reinicia um serviço específico"
    Write-Host ""
    Write-Host "${BLUE}Comandos de Status:${RESET}"
    Write-Host "  status             Status detalhado de todos os serviços"
    Write-Host "  health             Health check completo (todas as portas)"
    Write-Host "  logs [service]     Mostra logs (opcional: especificar serviço)"
    Write-Host "  volumes            Lista volumes Docker do projeto"
    Write-Host "  network            Mostra rede Docker e containers conectados"
    Write-Host ""
    Write-Host "${YELLOW}Comandos de Build:${RESET}"
    Write-Host "  install            Instala/atualiza dependências (npm)"
    Write-Host "  build              Faz build das imagens Docker"
    Write-Host "  migrate            Executa migrações do banco de dados"
    Write-Host "  check-types        Verifica erros de TypeScript"
    Write-Host ""
    Write-Host "${MAGENTA}Comandos de Backup:${RESET}"
    Write-Host "  backup             Cria backup do banco de dados"
    Write-Host "  restore            Restaura backup do banco de dados"
    Write-Host ""
    Write-Host "${CYAN}Comandos de Cache:${RESET}"
    Write-Host "  clean-cache                 Limpa cache do frontend (seguro)"
    Write-Host "  rebuild-frontend            Limpa cache e recria container frontend"
    Write-Host "  clear-turbopack-cache       ${YELLOW}Mata processo Node.js (rapido)${RESET}"
    Write-Host "  rebuild-frontend-complete   ${YELLOW}MATA processo + limpa volumes + rebuild${RESET}"
    Write-Host "                              Use quando componentes novos nao aparecem"
    Write-Host ""
    Write-Host "${RED}Comandos de Limpeza:${RESET}"
    Write-Host "  prune              Limpeza profunda do Docker (prune -a)"
    Write-Host "  clean              Remove todos os dados e volumes (CUIDADO!)"
    Write-Host ""
    Write-Host "  help               Mostra esta mensagem de ajuda"
    Write-Host ""
    Write-Host "Exemplos:"
    Write-Host "  .\system-manager.ps1 start"
    Write-Host "  .\system-manager.ps1 start-dev"
    Write-Host "  .\system-manager.ps1 restart-service backend"
    Write-Host "  .\system-manager.ps1 logs scrapers"
    Write-Host "  .\system-manager.ps1 health"
    Write-Host ""
    Write-Host "${GREEN}Core Services (7):${RESET}"
    Write-Host "  postgres, redis, python-service, backend, frontend,"
    Write-Host "  scrapers, api-service"
    Write-Host ""
    Write-Host "${CYAN}Dev Profile Services (2):${RESET}"
    Write-Host "  pgadmin (5150), redis-commander (8181)"
    Write-Host ""
    Write-Host "${YELLOW}Production Profile Services (1):${RESET}"
    Write-Host "  nginx (80/443)"
    Write-Host ""
    Write-Host "${BLUE}Portas do Sistema:${RESET}"
    Write-Host "  3100  Frontend         3101  Backend API"
    Write-Host "  5532  PostgreSQL       6479  Redis"
    Write-Host "  8000  API Service      8001  Python Service"
    Write-Host "  8080  OAuth API        6080  noVNC Web"
    Write-Host "  5900  VNC Direct       5150  PgAdmin"
    Write-Host "  8181  Redis Commander  80/443 Nginx"
    Write-Host ""
}

# ============================================
# FASE 143.0: Log Rotation & Cleanup
# ============================================

function Rotate-Logs {
    <#
    .SYNOPSIS
    Compacta logs grandes (> 10MB) em arquivos .gz

    .DESCRIPTION
    Encontra arquivos .txt > 10MB e os compacta com gzip.
    Útil para manter logs históricos sem ocupar muito espaço.

    .EXAMPLE
    .\system-manager.ps1 rotate-logs
    #>

    Print-Header "LOG ROTATION"

    Write-Host "${YELLOW}Buscando logs grandes (> 10MB)...${RESET}"

    $largeLogs = Get-ChildItem -Path . -Filter "*.txt" -File |
        Where-Object { $_.Length -gt 10MB } |
        Sort-Object Length -Descending

    if ($largeLogs.Count -eq 0) {
        Print-Success "Nenhum log grande encontrado"
        return
    }

    Write-Host "${CYAN}Encontrados ${largeLogs.Count} logs para rotação:${RESET}"
    foreach ($log in $largeLogs) {
        $sizeMB = [math]::Round($log.Length / 1MB, 2)
        Write-Host "  - $($log.Name): ${sizeMB}MB"
    }
    Write-Host ""

    foreach ($log in $largeLogs) {
        try {
            $compressedPath = "$($log.FullName).gz"

            # Se já existe .gz, pular
            if (Test-Path $compressedPath) {
                Write-Host "${YELLOW}⚠️  $($log.Name).gz já existe, pulando${RESET}"
                continue
            }

            Write-Host "${BLUE}Comprimindo $($log.Name)...${RESET}"

            # Usar 7zip se disponível, senão Compress-Archive
            if (Get-Command 7z -ErrorAction SilentlyContinue) {
                7z a -tgzip "$compressedPath" "$($log.FullName)" | Out-Null
            } else {
                Compress-Archive -Path $log.FullName -DestinationPath "$compressedPath.tmp"
                Rename-Item "$compressedPath.tmp" "$compressedPath"
            }

            $originalSize = [math]::Round($log.Length / 1MB, 2)
            $compressedSize = [math]::Round((Get-Item $compressedPath).Length / 1MB, 2)
            $ratio = [math]::Round((1 - ($compressedSize / $originalSize)) * 100, 1)

            # Remover original após comprimir
            Remove-Item $log.FullName

            Print-Success "$($log.Name): ${originalSize}MB → ${compressedSize}MB (${ratio}% redução)"
        } catch {
            Print-Error "Falha ao comprimir $($log.Name): $_"
        }
    }

    Write-Host ""
    Print-Success "Rotação de logs completa"
}

# Main script logic
$command = $args[0]
$param = $null
$verboseMode = $false

# Parse arguments
for ($i = 0; $i -lt $args.Count; $i++) {
    $arg = $args[$i]
    if ($arg -eq "-Verbose" -or $arg -eq "--verbose" -or $arg -eq "-v") {
        $verboseMode = $true
    }
    elseif ($i -eq 0) {
        $command = $arg
    }
    elseif ($null -eq $param -and $arg -ne "-Verbose" -and $arg -ne "--verbose" -and $arg -ne "-v") {
        $param = $arg
    }
}

switch ($command) {
    "start" { Start-System -VerboseMode $verboseMode }
    "start-dev" { Start-Dev }
    "start-prod" { Start-Production }
    "stop" { Stop-System }
    "restart" { Restart-System }
    "restart-service" { Restart-SingleService -ServiceName $param }
    "status" { Get-SystemStatus }
    "health" { Get-HealthCheck }
    "volumes" { Get-Volumes }
    "network" { Get-Network }
    "install" { Install-Dependencies }
    "build" { Build-DockerImages }
    "migrate" { Invoke-Migrations }
    "logs" { Get-Logs -Service $param }
    "backup" { Backup-Database }
    "restore" { Restore-Database }
    "clean-cache" { Clean-Cache }
    "rebuild-frontend" { Rebuild-Frontend }
    "rebuild-frontend-complete" { Rebuild-FrontendComplete }
    "clear-turbopack-cache" { Clear-TurbopackCache }  # FASE 148.4: Fast cache clear
    "rotate-logs" { Rotate-Logs }  # FASE 143.0: Automatic log rotation
    "check-types" { Check-Types }
    "prune" { Prune-System }
    "clean" { Clear-System }
    "help" { Show-Help }
    default {
        if ($command) {
            Print-Error "Comando desconhecido: $command"
        }
        Show-Help
    }
}
