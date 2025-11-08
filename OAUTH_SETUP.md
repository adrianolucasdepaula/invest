# 🔐 Configuração OAuth Cookies - Guia Completo

## 📋 Visão Geral

Este guia explica como configurar os cookies de autenticação OAuth necessários para os 19 scrapers que requerem login:

- **Google** (base OAuth)
- **Fundamentei, Investidor10, StatusInvest** (dados fundamentalistas)
- **Investing.com, ADVFN, Google Finance, TradingView** (dados de mercado)
- **ChatGPT, Gemini, DeepSeek, Claude, Grok** (análises AI)
- **Investing News, Valor, Exame, InfoMoney, Estadão, Mais Retorno** (notícias)

## ⚠️ Por que é Necessário?

O script `save_google_cookies.py` precisa:
- ✅ Abrir navegador Chrome **VISUAL** (não headless)
- ✅ Permitir login **MANUAL** em cada site
- ✅ Input do usuário (pressionar ENTER após cada login)
- ✅ Ambiente com **display gráfico** (Windows/Linux Desktop)

**NÃO funciona** diretamente em containers Docker sem configuração especial de display.

## 🚀 Método Recomendado: Windows Local

### Opção 1: Script Automatizado (FÁCIL)

Execute o script helper que criamos:

```powershell
cd "C:\Users\adria\Dropbox\PC (2)\Downloads\Python - Projetos\invest-claude-web"
.\setup-oauth-cookies.ps1
```

**O script vai automaticamente:**
1. ✓ Verificar se Python está instalado
2. ✓ Instalar Python via Microsoft Store (se necessário)
3. ✓ Instalar dependências (selenium, loguru, webdriver-manager)
4. ✓ Verificar Google Chrome
5. ✓ Executar save_google_cookies.py
6. ✓ Copiar cookies para container Docker automaticamente

### Opção 2: Manual (CONTROLE TOTAL)

#### Passo 1: Instalar Python

**Microsoft Store (Recomendado):**
1. Abra Microsoft Store
2. Busque "Python 3.11"
3. Clique em "Obter"

**python.org (Alternativo):**
1. Acesse: https://www.python.org/downloads/
2. Baixe Python 3.11+
3. ⚠️ **IMPORTANTE**: Marque "Add Python to PATH" durante instalação

**winget (Usuários Avançados):**
```powershell
winget install Python.Python.3.11
```

#### Passo 2: Verificar Instalação

```powershell
python --version
# Deve mostrar: Python 3.11.x ou superior
```

Se não funcionar, reinicie o PowerShell/Terminal.

#### Passo 3: Instalar Dependências

```powershell
cd "C:\Users\adria\Dropbox\PC (2)\Downloads\Python - Projetos\invest-claude-web\backend\python-scrapers"

python -m pip install selenium==4.15.2 loguru==0.7.2 webdriver-manager==4.0.1
```

#### Passo 4: Verificar Google Chrome

Certifique-se de que Google Chrome está instalado:
- Download: https://www.google.com/chrome/

#### Passo 5: Executar Script

```powershell
cd backend\python-scrapers
python save_google_cookies.py
```

#### Passo 6: Seguir Instruções Interativas

O script vai:
1. Abrir Chrome automaticamente
2. Navegar para cada site
3. Mostrar instruções de login
4. Esperar você fazer login manualmente
5. Aguardar você pressionar ENTER
6. Salvar cookies
7. Repetir para todos os 19 sites

**⏱️ Tempo estimado: 1-2 horas**

#### Passo 7: Verificar Cookies Criados

```powershell
ls backend\python-scrapers\browser-profiles\google_cookies.pkl
```

#### Passo 8: Copiar para Container Docker

```powershell
docker cp "backend\python-scrapers\browser-profiles\google_cookies.pkl" invest_scrapers:/app/browser-profiles/
```

#### Passo 9: Verificar no Container

```bash
docker exec invest_scrapers ls -lh /app/browser-profiles/google_cookies.pkl
```

## 🐧 Método Alternativo: Linux com X11

Se você usa Linux Desktop (não WSL sem GUI):

```bash
cd backend/python-scrapers

# Instalar dependências
pip3 install selenium loguru webdriver-manager

# Executar script
python3 save_google_cookies.py

# Copiar para container
docker cp browser-profiles/google_cookies.pkl invest_scrapers:/app/browser-profiles/
```

## 🐳 Método Avançado: Docker com X11 (NÃO RECOMENDADO)

Possível mas complexo. Requer:
- X11 server no Windows (VcXsrv, Xming)
- Configuração DISPLAY
- Modificação docker-compose.yml

**Não recomendado** devido à complexidade. Use Opção 1 (Windows Local).

## 📝 Notas Importantes

### Sites que Requerem Login com Google

Após fazer login no Google, muitos sites usarão OAuth automaticamente:
- Fundamentei
- Investidor10
- StatusInvest
- Investing.com
- Google Finance
- TradingView
- Mais Retorno

### Sites com Login Próprio

Alguns sites requerem conta específica:
- **ChatGPT**: Conta OpenAI (pode criar grátis)
- **Claude**: Conta Anthropic (pode criar grátis)
- **Grok**: Conta X/Twitter
- **Valor, Exame, Estadão**: Podem requerer assinatura paga

### Sites Opcionais

Se não tiver conta, pode **pular** pressionando ENTER sem fazer login. Os scrapers funcionarão em modo limitado.

## 🔄 Renovação de Cookies

Os cookies OAuth expiram após **7-14 dias**. Você precisará:

1. Executar novamente o script periodicamente
2. Ou usar Opção 2 do script (atualizar apenas sites específicos)
3. Ou usar Opção 3 (atualizar apenas sites que falharam)

## ❓ Troubleshooting

### "Python não foi encontrado"

**Causa**: Python não instalado ou não está no PATH

**Solução**:
1. Instale Python (veja Passo 1)
2. Reinicie PowerShell após instalação
3. Se ainda não funcionar, reinicie o Windows

### "Chrome não abre" ou "WebDriver error"

**Causa**: Chrome não instalado ou versão incompatível

**Solução**:
1. Instale/Atualize Chrome: https://www.google.com/chrome/
2. O webdriver-manager vai baixar o ChromeDriver correto automaticamente

### "ModuleNotFoundError: selenium"

**Causa**: Dependências não instaladas

**Solução**:
```powershell
python -m pip install selenium loguru webdriver-manager
```

### Script trava em "Waiting for login..."

**Causa**: Script esperando você fazer login no navegador

**Solução**:
1. Faça login manualmente no navegador Chrome que abriu
2. Volte ao terminal PowerShell
3. Pressione ENTER para continuar

### Cookies não funcionam nos scrapers

**Causa**: Cookies podem ter expirado ou serem inválidos

**Solução**:
1. Execute o script novamente
2. Use Opção 3 para atualizar apenas sites problemáticos

## 📊 Status Atual do Sistema

Você pode verificar o status sem os cookies:

```bash
# Health check geral
curl http://localhost:8000/health

# Testar scraper específico
curl -X POST http://localhost:8000/api/scrapers/test \
  -H "Content-Type: application/json" \
  -d '{"scraper_name": "statusinvest", "ticker": "PETR4"}'
```

**Scrapers sem cookies** funcionarão em modo limitado:
- ✅ Scrapers públicos (B3, BCB, Fundamentus, etc.) funcionam 100%
- ⚠️ Scrapers com login funcionam parcialmente (dados públicos apenas)
- ✗ Scrapers premium requerem cookies obrigatoriamente

## ✅ Verificação de Sucesso

Após configurar os cookies, verifique:

```bash
# 1. Arquivo existe
docker exec invest_scrapers ls -lh /app/browser-profiles/google_cookies.pkl

# 2. Testar scraper que requer login
curl -X POST http://localhost:8000/api/scrapers/test \
  -H "Content-Type: application/json" \
  -d '{"scraper_name": "statusinvest", "ticker": "PETR4"}'
```

Se funcionar, você verá dados completos em vez de erros de autenticação.

## 📞 Suporte

Em caso de problemas:

1. Verifique logs do container:
   ```bash
   docker logs invest_scrapers --tail 100
   ```

2. Verifique issues do projeto

3. Consulte documentação oficial Selenium

## 🎯 Próximos Passos

Após configurar os cookies com sucesso:

1. ✅ **Fase 1 estará 100% completa**
2. ➡️ Avançar para **Fase 2: Testes Iniciais**
3. ➡️ Testar todos os 27 scrapers individualmente
4. ➡️ Validar agregação de dados
5. ➡️ Configurar análise AI

---

**Atualizado em**: 2025-11-07
**Versão**: 1.0.0
