# ⚠️ EXECUTE AGORA - Solução Definitiva

## 🔴 Problema Identificado

O comando `schtasks` **não consegue** processar caminhos com **parênteses** (como "PC (2)"), mesmo com escaping correto.

**Erro:**
```
ERRO: Argumento/opção inválido - '(2)\Downloads\Python'
```

---

## ✅ Solução Definitiva - XML Import

Criamos **definições XML** para ambas as tasks. XML escapa caracteres especiais automaticamente.

**Arquivos criados:**
- ✅ `task1-daily.xml` - Task 1 (Daily Tier 1)
- ✅ `task2-weekly.xml` - Task 2 (Weekly Tier 2)
- ✅ `create-tasks-xml-method.ps1` - Script de criação via XML

---

## 🚀 COMO EXECUTAR (Como Administrador)

### **Método 1: Script Automático (RECOMENDADO)**

1. **Abra PowerShell como Administrador:**
   - Pressione `Win + X`
   - Clique em "Windows PowerShell (Admin)" ou "Terminal (Admin)"

2. **Navegue até o projeto:**
   ```powershell
   cd "C:\Users\adria\Dropbox\PC (2)\Downloads\Python - Projetos\invest-claude-web"
   ```

3. **Execute o setup completo:**
   ```powershell
   .\SETUP-AUTOMATION.ps1
   ```

**O que vai acontecer:**
- ✅ Task 1 e Task 2 serão criadas via XML import
- ✅ Variáveis de ambiente serão configuradas
- ✅ Sistema será verificado
- ✅ (Opcional) Teste manual executará limpeza imediata

**Duração:** 5-10 minutos

---

### **Método 2: Apenas Criar Tasks (Rápido)**

Se quiser **apenas** criar as tasks sem configurar o resto:

```powershell
cd "C:\Users\adria\Dropbox\PC (2)\Downloads\Python - Projetos\invest-claude-web"
.\create-tasks-xml-method.ps1
```

**Duração:** 1 minuto

---

## 📋 O Que Será Criado

| Task | Agendamento | Quando Executa | Objetivo |
|------|-------------|----------------|----------|
| **B3_DiskCleanup_Daily_Tier1** | Diário | 2:00 AM | Liberar 10-20GB sem downtime |
| **B3_DiskCleanup_Weekly_Tier2** | Semanal (Domingo) | 3:00 AM | Liberar 50-100GB com Docker restart |

---

## ✅ Verificar se Funcionou

Após executar, rode:

```powershell
.\quick-check.ps1
```

**Deve mostrar:**
```
[OK] Task 1 (Daily Tier 1) exists
[OK] Task 2 (Weekly Tier 2) exists
Task 1 (Daily Tier 1):
  State: Ready
  Next Run: 31/12/2025 02:00:00
Task 2 (Weekly Tier 2):
  State: Ready
  Next Run: 05/01/2026 03:00:00
```

---

## 🧪 Testar Agora (Opcional)

Se quiser liberar espaço **AGORA** sem esperar até amanhã 2:00 AM:

```powershell
# Executar Task 1 manualmente (como Admin)
schtasks.exe /run /tn B3_DiskCleanup_Daily_Tier1

# Monitorar em tempo real
Get-Content backend\src\scripts\cleanup-tier1.log -Wait -Tail 20
```

**Pressione Ctrl+C** para parar de monitorar (task continua rodando).

**Resultado esperado:**
- 🎯 10-20GB de espaço liberado
- ⏱️ Duração: 2-5 minutos
- ✅ Zero downtime (Docker continua rodando)

---

## 🔧 Próximo Passo: Configurar Backend

Depois de criar as tasks, configure o backend para NestJS cleanups:

```powershell
.\configure-cleanup-env.ps1
```

**Perguntas que irá fazer:**

1. **"Change CLEANUP_ENABLED to 'true'?"**
   - Responda: **y** (ativa limpeza automática NestJS)

2. **"Start in DRY RUN mode?"**
   - **n** = Modo REAL (deleta arquivos) ← Recomendado
   - **y** = Modo SIMULAÇÃO (apenas testa, não deleta)

Depois de configurar, **reinicie o backend:**

```powershell
docker restart invest_backend
```

---

## 📊 Status Pós-Setup

Após executar tudo:

| Item | Status Esperado |
|------|----------------|
| **Scheduled Tasks** | ✅ 2 tasks criadas e Ready |
| **Disk Space** | ⚠️ 69.4GB (será liberado em 10-20GB após primeira execução) |
| **Backend .env** | ✅ CLEANUP_ENABLED=true |
| **Next Run** | ✅ Amanhã 2:00 AM (Task 1) |

---

## ❓ FAQ

### "Por que XML funciona e schtasks não?"

XML import usa parser diferente que lida corretamente com caracteres especiais. O `schtasks /create` com parâmetros na linha de comando falha com parênteses no caminho.

### "As tasks vão persistir após reiniciar?"

Sim! Tasks criadas via `schtasks /create /xml` são persistidas no Windows Task Scheduler permanentemente.

### "Preciso executar novamente depois de reiniciar?"

Não. Execute **uma vez** e as tasks funcionarão automaticamente para sempre (até você deletá-las manualmente).

### "E se eu quiser deletar as tasks?"

```powershell
schtasks.exe /delete /tn "B3_DiskCleanup_Daily_Tier1" /f
schtasks.exe /delete /tn "B3_DiskCleanup_Weekly_Tier2" /f
```

---

## 🎯 TL;DR - Execute Isso Agora

1. **PowerShell como Admin**
2. `cd "C:\Users\adria\Dropbox\PC (2)\Downloads\Python - Projetos\invest-claude-web"`
3. `.\SETUP-AUTOMATION.ps1`
4. Responda **y** para as perguntas
5. Aguarde 5-10 minutos
6. ✅ **PRONTO!** Sistema 100% automatizado

---

**Última atualização:** 2025-12-30 (Solução XML Definitiva)
