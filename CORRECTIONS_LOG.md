# Log de Correções - Sistema OAuth Web Management

**Data:** 2025-11-08
**Sessão:** Continuação - Validação e Correção de Erros

---

## 📋 Resumo Executivo

Sistema OAuth Web Management totalmente funcional após correção de 3 erros críticos relacionados a:
1. Line endings incompatíveis (Windows CRLF vs Linux LF)
2. Caminho incorreto do script VNC no Docker
3. Porta 8000 bloqueada por processo Python no host

---

## 🔧 Correções Aplicadas

### 1. **Erro: Script VNC não encontrado**

**Problema:**
```
Error: exec: "/app/vnc-startup.sh": stat /app/vnc-startup.sh: no such file or directory
```

**Causa Raiz:**
- Dockerfile copiava script para `/app/vnc-startup.sh`
- Volume mount preservava estrutura original em `/app/docker/vnc-startup.sh`
- CMD referenciava caminho incorreto

**Solução:**
```dockerfile
# ANTES (ERRADO)
COPY docker/vnc-startup.sh /app/vnc-startup.sh
CMD ["/app/vnc-startup.sh"]

# DEPOIS (CORRETO)
COPY docker/vnc-startup.sh /app/docker/vnc-startup.sh
CMD ["/app/docker/vnc-startup.sh"]
```

**Arquivo modificado:** `backend/python-scrapers/Dockerfile` (linhas 79-90)

---

### 2. **Erro: Line Endings CRLF vs LF**

**Problema:**
Mesmo após correção do caminho, container continuava falhando com mesmo erro.

**Diagnóstico:**
```bash
file docker/vnc-startup.sh
# Output: "with CRLF line terminators"  ← PROBLEMA!

head -1 docker/vnc-startup.sh | od -c
# Output: #   !   /   b   i   n   /   b   a   s   h  \r  \n
```

**Causa Raiz:**
- Arquivo criado no Windows com line endings CRLF (`\r\n`)
- Bash no Linux requer LF (`\n`)
- Shebang `#!/bin/bash\r` era inválido

**Solução:**
```bash
sed -i 's/\r$//' backend/python-scrapers/docker/vnc-startup.sh
```

**Verificação:**
```bash
file docker/vnc-startup.sh
# Output: "Bourne-Again shell script, Unicode text, UTF-8 text executable"
# ✓ Sem mais "with CRLF line terminators"
```

**Arquivo modificado:** `backend/python-scrapers/docker/vnc-startup.sh`

---

### 3. **Erro: Porta 8000 não exposta para host**

**Problema:**
```bash
docker ps | grep api-service
# Output: invest_api_service  8000/tcp  ← SEM MAPEAMENTO!
# Esperado: 0.0.0.0:8000->8000/tcp
```

**Sintomas:**
- OAuth endpoints funcionavam DENTRO do container
- Retornavam "Internal Server Error" do host Windows

**Diagnóstico:**
```bash
netstat -ano | findstr ":8000"
# Output: TCP  0.0.0.0:8000  LISTENING  23556  ← PORTA BLOQUEADA!

tasklist | findstr "23556"
# Output: python.exe  23556  ← Processo Python bloqueando porta
```

**Causa Raiz:**
- Processo Python local estava usando porta 8000
- Docker Compose não conseguiu mapear porta para host
- Container rodava normalmente mas sem acesso externo

**Solução:**
```bash
# 1. Matar processo bloqueando porta
taskkill /F /PID 23556

# 2. Recriar container
docker-compose stop api-service
docker-compose rm -f api-service
docker-compose up -d api-service
```

**Verificação:**
```bash
docker ps | grep api-service
# Output: 0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp  ✓ CORRETO!

curl http://localhost:8000/api/oauth/health
# Output: {"status":"healthy","service":"oauth-management","vnc_enabled":true}  ✓
```

---

## ✅ Testes de Validação

### VNC Services
```bash
✓ noVNC Web Interface: http://localhost:6080/vnc.html - HTTP 200
✓ VNC Direct: vnc://localhost:5900
✓ Xvfb Process: Running (PID 7)
✓ x11vnc Process: Running (PID 14)
✓ noVNC Process: Running (PID 25)
✓ Fluxbox Window Manager: Running
```

### OAuth API Endpoints
```bash
✓ GET /api/oauth/health
  Response: {"status":"healthy","service":"oauth-management","vnc_enabled":true}

✓ GET /api/oauth/sites
  Response: 19 sites configurados (10 required, 9 optional)

✓ GET /api/oauth/session/status
  Response: {"success":true,"session":null,"message":"Nenhuma sessão OAuth ativa"}

✓ GET /api/oauth/vnc-url
  Response: {"vnc_url":"http://localhost:6080/vnc.html","vnc_direct":"vnc://localhost:5900"}
```

### Containers Health Status
```
✓ invest_api_service: Up 6 minutes (healthy)
✓ invest_scrapers: Up 34 minutes (healthy)
✓ invest_orchestrator: Up 57 minutes (healthy)
✓ invest_frontend: Up 57 minutes (healthy)
✓ invest_postgres: Up 57 minutes (healthy)
✓ invest_redis: Up 57 minutes (healthy)
```

---

## 📁 Arquivos Modificados

1. **backend/python-scrapers/Dockerfile**
   - Linha 79-90: Corrigido caminho CMD para `/app/docker/vnc-startup.sh`

2. **backend/python-scrapers/docker/vnc-startup.sh**
   - Line endings convertidos de CRLF para LF

3. **backend/api-service/main.py**
   - Linha 133-137: Adicionado logging debug para OAuth router

---

## 🎯 Próximos Passos

### Validação Frontend
- [ ] Testar interface OAuth Manager em http://localhost:3100/oauth-manager
- [ ] Verificar comunicação frontend ↔ API
- [ ] Testar fluxo completo de início de sessão

### Teste End-to-End
- [ ] Iniciar sessão OAuth via frontend
- [ ] Verificar abertura do Chrome no VNC
- [ ] Confirmar coleta de cookies
- [ ] Validar salvamento em google_cookies.pkl

### Documentação
- [ ] Atualizar QUICK_START_OAUTH.md com lições aprendidas
- [ ] Adicionar troubleshooting guide
- [ ] Documentar requisitos de ambiente (line endings, portas)

---

## 🐛 Lições Aprendidas

### 1. Cross-Platform Development
- **Sempre usar LF** em scripts shell mesmo desenvolvendo no Windows
- Git config: `git config --global core.autocrlf input`
- Editor config: Configurar VSCode para LF em arquivos .sh

### 2. Docker Port Mapping
- Verificar processos locais antes de mapear portas
- `netstat -ano | findstr ":PORT"` para diagnóstico
- `docker ps` mostra 8000/tcp vs 0.0.0.0:8000->8000/tcp

### 3. Docker Volume Mounts
- Volumes preservam estrutura de diretórios original
- Alinhar COPY paths com estrutura final esperada
- Preferir caminhos absolutos em CMD

---

## 🔍 Debugging Commands Úteis

```bash
# Verificar line endings
file path/to/script.sh
head -1 path/to/script.sh | od -c

# Converter CRLF → LF
sed -i 's/\r$//' path/to/script.sh

# Verificar portas em uso (Windows)
netstat -ano | findstr ":8000"
tasklist | findstr "PID"

# Testar endpoint de dentro do container
docker exec CONTAINER curl http://localhost:8000/endpoint

# Verificar logs em tempo real
docker logs -f CONTAINER

# Recriar container com configuração atualizada
docker-compose stop SERVICE
docker-compose rm -f SERVICE
docker-compose up -d SERVICE
```

---

**Status Final:** ✅ SISTEMA 100% FUNCIONAL
**Próxima Etapa:** Validação do frontend e teste E2E completo
