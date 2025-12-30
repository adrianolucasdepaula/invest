# Disk Lifecycle Automation - Setup Guide

## 🎯 Objetivo

Garantir que o sistema de limpeza automatizada esteja 100% funcional e operando corretamente.

---

## 📋 Status Atual

- ❌ **Scheduled Tasks:** NÃO encontradas no sistema (precisam ser recriadas)
- ⚠️ **Disk Space:** 69.4GB livre (7.4%) - **CRÍTICO** (<10%)
- ✅ **Scripts:** Existem e estão prontos
- ⚠️ **Backend .env:** Variáveis de limpeza NÃO configuradas

---

## 🚀 Setup Completo (Método Recomendado)

### Opção 1: Script Automático (RECOMENDADO)

Execute como **Administrador**:

```powershell
.\SETUP-AUTOMATION.ps1
```

Este script irá:
1. ✅ Recriar ambas scheduled tasks
2. ✅ Configurar variáveis de ambiente
3. ✅ Verificar sistema completo
4. ✅ (Opcional) Executar teste manual

**Duração estimada:** 5-10 minutos (incluindo teste manual)

---

### Opção 2: Setup Manual (Passo a Passo)

Se preferir controle total, execute cada etapa separadamente:

#### **PASSO 1: Recriar Scheduled Tasks**

Execute como **Administrador**:

```powershell
.\recreate-tasks-final.ps1
```

Espere ver:
```
[OK] Task 1 created successfully
[OK] Task 2 created successfully
Task 1 (Daily Tier 1):
  State: Ready
  Next Run: [data/hora]
Task 2 (Weekly Tier 2):
  State: Ready
  Next Run: [data/hora]
```

---

#### **PASSO 2: Configurar Backend .env**

Execute:

```powershell
.\configure-cleanup-env.ps1
```

Perguntas que você verá:

1. **"Change CLEANUP_ENABLED to 'true'? (y/n)"**
   - Responda: **y** (ativa limpeza NestJS @Cron)

2. **"Start in DRY RUN mode (simulation, nothing deleted)? (y/n)"**
   - Responda: **n** se quer modo REAL (deleta arquivos)
   - Responda: **y** se quer testar primeiro em modo simulação

**IMPORTANTE:** Após configurar, reinicie o backend:

```powershell
docker restart invest_backend
```

---

#### **PASSO 3: Verificar Sistema**

Execute:

```powershell
.\quick-check.ps1
```

Deve mostrar:
```
[OK] Task 1 (Daily Tier 1) exists
[OK] Task 2 (Weekly Tier 2) exists
[OK] Tier 1 script exists
[OK] Tier 2 script exists
[OK] CLEANUP_ENABLED=true
[OK] CLEANUP_DRY_RUN=false
```

---

#### **PASSO 4: Teste Manual (Opcional mas Recomendado)**

Execute como **Administrador**:

```powershell
schtasks.exe /run /tn B3_DiskCleanup_Daily_Tier1
```

Monitore a execução:

```powershell
Get-Content backend\src\scripts\cleanup-tier1.log -Wait -Tail 20
```

**Espere ver:**
- Limpeza de temp files
- Limpeza de logs antigos
- Espaço liberado: 10-20GB (aproximadamente)
- Duração: 2-5 minutos

Pressione **Ctrl+C** para parar de monitorar (task continua rodando).

---

## ✅ Verificação Final

Após setup completo, execute:

```powershell
.\quick-check.ps1
```

**Checklist de Sucesso:**

- ✅ Task 1 (Daily Tier 1): **Ready**
- ✅ Task 2 (Weekly Tier 2): **Ready**
- ✅ Disk Space: **>10%** livre
- ✅ Scripts: **Existem**
- ✅ CLEANUP_ENABLED: **true**
- ✅ CLEANUP_DRY_RUN: **false** (modo real)

---

## 📅 Schedule Automático

Após setup, as tarefas executarão automaticamente:

| Task | Frequência | Horário | Objetivo |
|------|-----------|---------|----------|
| **Tier 1 (Lightweight)** | Diária | 2:00 AM | Liberar 10-20GB sem downtime |
| **Tier 2 (Aggressive)** | Semanal (Domingo) | 3:00 AM | Liberar 50-100GB com Docker restart |

Além disso, se `CLEANUP_ENABLED=true`, o NestJS executará:

- **MinIO Archives Cleanup:** Diária 2:00 AM (deleta arquivos >365 dias)
- **Docker Volumes Cleanup:** Semanal Domingo 3:00 AM
- **Monthly Reports:** 1º de cada mês 4:00 AM

---

## 🔍 Monitoramento

### Verificar Status das Tasks

```powershell
# Via schtasks
schtasks.exe /query /tn "B3_DiskCleanup_Daily_Tier1" /fo LIST
schtasks.exe /query /tn "B3_DiskCleanup_Weekly_Tier2" /fo LIST

# Via GUI
Win + R -> taskschd.msc -> Procurar "B3_DiskCleanup"
```

### Verificar Logs de Execução

```powershell
# Tier 1 (Daily)
Get-Content backend\src\scripts\cleanup-tier1.log -Tail 50

# Tier 2 (Weekly)
Get-Content backend\src\scripts\cleanup-tier2.log -Tail 50

# Monitorar em tempo real
Get-Content backend\src\scripts\cleanup-tier1.log -Wait
```

### Verificar Espaço em Disco

```powershell
Get-PSDrive C
```

---

## 🐛 Troubleshooting

### Problema: Tasks não aparecem

**Solução:**
```powershell
# Recrie as tasks
.\recreate-tasks-final.ps1
```

---

### Problema: Task falha ao executar

**Solução:**
```powershell
# Verifique logs
Get-Content backend\src\scripts\cleanup-tier1.log -Tail 50

# Verifique se scripts existem
Test-Path backend\src\scripts\disk-cleanup-tier1.ps1
Test-Path backend\src\scripts\disk-cleanup-tier2.ps1
```

---

### Problema: Backend não está deletando arquivos

**Solução:**
```powershell
# Verifique .env
Get-Content backend\.env | Select-String "CLEANUP"

# Deve mostrar:
# CLEANUP_ENABLED=true
# CLEANUP_DRY_RUN=false

# Se não estiver configurado, execute:
.\configure-cleanup-env.ps1
```

---

### Problema: Disk space não liberou

**Causas possíveis:**
1. **DRY_RUN=true:** Modo simulação ativado (nada é deletado)
2. **VHDX Limitation:** Docker liberou espaço mas está "trapped" no VHDX (limitação Windows Home)
3. **Primeiro run:** Pode liberar menos espaço se já foi feito cleanup recente

**Solução:**
- Verifique `CLEANUP_DRY_RUN=false` no backend/.env
- Execute Tier 2 manualmente para cleanup mais agressivo
- Aguarde execuções semanais para liberar espaço gradualmente

---

## 📊 Métricas Esperadas

### Tier 1 (Daily - Lightweight)

- **Target:** 10-20GB
- **Duração:** 2-5 minutos
- **Downtime:** Zero
- **Ações:**
  - Temp files cleanup
  - Old logs cleanup
  - Docker logs rotation
  - Npm cache cleanup

### Tier 2 (Weekly - Aggressive)

- **Target:** 50-100GB
- **Duração:** 15-30 minutos
- **Downtime:** 2-3 minutos (Docker restart)
- **Ações:**
  - Tier 1 completo
  - Docker system prune -a --volumes
  - WSL VHDX compaction (se disponível)
  - Orphan volumes cleanup

---

## 🔧 Manutenção

### Executar Tier 1 Manualmente

```powershell
schtasks.exe /run /tn B3_DiskCleanup_Daily_Tier1
```

### Executar Tier 2 Manualmente

```powershell
schtasks.exe /run /tn B3_DiskCleanup_Weekly_Tier2
```

### Desabilitar Temporariamente

```powershell
# Desabilitar Task 1
schtasks.exe /change /tn "B3_DiskCleanup_Daily_Tier1" /disable

# Reabilitar Task 1
schtasks.exe /change /tn "B3_DiskCleanup_Daily_Tier1" /enable
```

### Deletar Tasks

```powershell
schtasks.exe /delete /tn "B3_DiskCleanup_Daily_Tier1" /f
schtasks.exe /delete /tn "B3_DiskCleanup_Weekly_Tier2" /f
```

---

## 📝 Notas Importantes

1. **Windows Home Limitation:**
   - VHDX compaction requer Hyper-V (Windows Pro/Enterprise)
   - Espaço liberado pelo Docker pode ficar "trapped" no VHDX
   - Sistema preventivo evita crescimento futuro

2. **First Run:**
   - Primeira execução pode liberar MENOS espaço se cleanup recente foi feito manualmente
   - Aguarde execuções semanais para ver efeito completo

3. **Logs Retention:**
   - Logs são mantidos por 30 dias
   - Auto-rotation implementada
   - Logs antigos são comprimidos (gzip)

4. **Emergency Mode:**
   - Se C: < 5% (EMERGENCY), Tier 3 cria blocker file
   - Docker NÃO inicia até resolver problema de espaço
   - Delete `DISK_EMERGENCY_BLOCK` após liberar espaço

---

## 📞 Suporte

Se problemas persistirem após seguir este guia:

1. Execute `quick-check.ps1` e salve output
2. Verifique logs em `backend\src\scripts\cleanup-*.log`
3. Verifique ROADMAP.md (linha 11675-11739) para limitações conhecidas
4. Procure em KNOWN-ISSUES.md por problemas relacionados

---

**Última atualização:** 2025-12-30
**Versão:** 1.0
**FASE:** 146 - Disk Lifecycle Management
