# Fix: Fundamentei OAuth Button Auto-Click

**Data:** 2025-11-15
**Problema:** XPath do botão "Logar com o Google" não funcionava
**Status:** ✅ CORRIGIDO

---

## 🐛 Problema Identificado

Durante o teste OAuth, o auto-click do botão Google no Fundamentei falhou:

```
2025-11-15 02:28:05.904 | INFO | [NAVIGATE] Tentando clicar automaticamente no botão OAuth...
2025-11-15 02:28:05.905 | DEBUG | [NAVIGATE] XPath do botão: //button[contains(text(), 'Google')]
2025-11-15 02:28:19.722 | WARNING | [NAVIGATE] Não foi possível clicar automaticamente: Message:
```

**Timeout:** 10 segundos
**Causa:** XPath incorreto

---

## 🔍 Análise

### XPath Antigo (INCORRETO)
```python
"oauth_button": "//button[contains(text(), 'Google')]"
```

**Por que falhou:**
- O texto "Logar com o Google" está dentro de um elemento filho `<generic>`
- `contains(text(), 'Google')` só busca no texto direto do botão
- Precisa usar `contains(., 'Google')` para buscar em todos os descendentes

### Estrutura Real do HTML
```yaml
button "Logar com o Google" [ref=e32]:
  - img [ref=e33]
  - generic [ref=e39]: Logar com o Google
```

---

## ✅ Solução Implementada

### XPath Novo (CORRETO)
```python
"oauth_button": "//button[contains(., 'Logar com o Google')]"
```

**Mudanças:**
- `text()` → `.` (busca em todos os descendentes)
- `'Google'` → `'Logar com o Google'` (texto completo)

---

## 📝 Arquivo Modificado

**Arquivo:** `backend/python-scrapers/oauth_sites_config.py`
**Linha:** 53

```python
{
    "id": "fundamentei",
    "name": "Fundamentei",
    "category": SiteCategory.FUNDAMENTAL,
    "url": "https://fundamentei.com.br/login",
    "login_type": "oauth",
    "login_selector": "//a[contains(@href, '/logout')]",
    "oauth_button": "//button[contains(., 'Logar com o Google')]",  # ← CORRIGIDO
    "instructions": "Clique em 'Continuar com Google' se solicitado...",
    "wait_time": 20,
    "order": 2,
    "required": True,
    "auto_click_oauth": True,
    "verification_url": "https://fundamentei.com.br/",
}
```

---

## 🧪 Próxima Validação

Para testar se o fix funcionou:

1. Reiniciar containers (se necessário):
   ```bash
   docker-compose restart api-service scrapers
   ```

2. Iniciar nova sessão OAuth

3. Verificar logs quando processar Fundamentei:
   ```
   [NAVIGATE] Tentando clicar automaticamente no botão OAuth...
   [NAVIGATE] XPath do botão: //button[contains(., 'Logar com o Google')]
   [NAVIGATE] Botão OAuth clicado automaticamente  # ← DEVE APARECER
   ```

---

## 📊 Impacto

**Antes do Fix:**
- Fundamentei: ❌ Auto-click falhou → Usuário teve que pular

**Depois do Fix (esperado):**
- Fundamentei: ✅ Auto-click funcionando → Login automático via Google

---

**Commit:** Próximo commit com tag `fix-fundamentei-oauth-button`
