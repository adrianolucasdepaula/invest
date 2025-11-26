# Guia de Acesso ao VNC - OAuth Manager

## Como Acessar

1. **Abra seu navegador** (Chrome, Firefox, Edge, etc.)

2. **Acesse o VNC:**
   ```
   http://localhost:6080/vnc.html
   ```

3. **Clique em "Connect"** se não conectar automaticamente

## Como Usar

### Interface VNC

Você verá o desktop virtual com o Chrome aberto. A interface do noVNC tem:

- **Canvas central**: Tela do Chrome (clique e digite normalmente)
- **Barra lateral esquerda**: Botões de controle
  - 📋 Área de transferência (copiar/colar)
  - ⛶ Full screen
  - ⚙️ Configurações
  - ❌ Desconectar

### Interação com Mouse e Teclado

✅ **FUNCIONA NORMALMENTE:**
- **Clique**: Clique com mouse na tela
- **Digitação**: Digite normalmente no teclado
- **Scroll**: Use o scroll do mouse
- **Atalhos**: Ctrl+C, Ctrl+V, etc.

### Fazer Login no Google

1. **Inicie a sessão OAuth:**
   ```bash
   curl -X POST http://localhost:8000/api/oauth/session/start
   ```

2. **Acesse o VNC:**
   ```
   http://localhost:6080/vnc.html
   ```

3. **Interaja com a página:**
   - Clique no campo de email
   - Digite seu email do Google
   - Clique em "Avançar"
   - Digite sua senha
   - Conclua autenticação 2FA se necessário

4. **Aguarde coleta automática:**
   - O sistema navega pelos 21 sites automaticamente
   - Chrome reinicia entre cada site
   - Cookies salvos em `/app/browser-profiles/google_cookies.pkl`

## Verificar Status

```bash
# Status da sessão
curl http://localhost:8000/api/oauth/session/status | jq

# Progresso
curl -s http://localhost:8000/api/oauth/session/status | jq '.session.progress_percentage'

# Sites concluídos
curl -s http://localhost:8000/api/oauth/session/status | jq '.session.completed_sites'
```

## Salvar Cookies Manualmente

Se a sessão não salvar automaticamente:

```bash
curl -X POST http://localhost:8000/api/oauth/session/save
```

## Troubleshooting

### VNC mostra tela vazia

```bash
# Reiniciar containers
docker-compose restart scrapers api-service

# Aguardar 20 segundos
sleep 20

# Iniciar nova sessão
curl -X POST http://localhost:8000/api/oauth/session/start
```

### Chrome não aparece no VNC

```bash
# Executar dentro do container
docker exec invest_scrapers sh -c "DISPLAY=:99 xdotool search --name 'Chrome' windowactivate windowraise windowmove 0 0"
```

### Mouse/Teclado não funciona

- Clique diretamente na tela (canvas)
- Recarregue a página do VNC
- Verifique se x11vnc está rodando:
  ```bash
  docker exec invest_scrapers ps aux | grep x11vnc
  ```

## Resumo Técnico

| Componente | Status |
|------------|--------|
| VNC Server | x11vnc no :99 |
| noVNC Web | http://localhost:6080 |
| Display | Xvfb 1920x1080 |
| Input | Mouse + Teclado ✅ |
| Chrome | Reinicia entre sites |

## Fluxo Completo

```
┌─────────────────────────────────────────────────┐
│ 1. Iniciar sessão OAuth (curl POST)            │
│ 2. Acessar http://localhost:6080/vnc.html      │
│ 3. Fazer login Google manualmente              │
│ 4. Sistema coleta cookies de 21 sites          │
│ 5. Cookies salvos automaticamente              │
└─────────────────────────────────────────────────┘
```

**Pronto para uso!** Acesse http://localhost:6080/vnc.html e faça login normalmente.
