# BUG OAuth VNC - Solucao Definitiva

**Data:** 2025-11-26
**Status:** RESOLVIDO
**Severidade:** Alta (bloqueava coleta de cookies)

## Problema Original

O Chrome iniciava mas nao aparecia no VNC, mostrando tela vazia ou imagem stale do fundamentei.io.

## Causa Raiz (Multiplas)

### 1. Lock Files do Xvfb
- Ao reiniciar container, `/tmp/.X99-lock` permanecia
- Xvfb falhava com "Server is already active for display 99"
- Container entrava em restart loop

### 2. Chrome Zombie Processes
- Chrome crashava mas driver Selenium continuava existindo
- API reportava sessao ativa com Chrome morto
- Nenhum health check detectava o problema

### 3. Namespace de Rede Orfao
- api-service usa `network_mode: "service:scrapers"`
- Ao recriar scrapers, api-service perdia conexao de rede
- Erro: "joining network namespace of container: No such container"

## Solucoes Implementadas

### 1. Reinicio Completo do Chrome Entre Sites (oauth_session_manager.py)

```python
def restart_chrome_fresh(self) -> bool:
    """Reiniciar Chrome completamente - mata TODOS os processos e inicia novo."""
    import subprocess

    # 1. Fechar driver Selenium graciosamente
    if self.driver:
        try:
            self.driver.quit()
        except:
            pass
        self.driver = None

    # 2. Matar TODOS os processos Chrome/Chromedriver
    subprocess.run(["pkill", "-9", "-f", "chrome"], capture_output=True, timeout=10)
    subprocess.run(["pkill", "-9", "-f", "chromedriver"], capture_output=True, timeout=10)
    time.sleep(2)

    # 3. Iniciar novo Chrome limpo
    return self.start_chrome()
```

**Chamado automaticamente em `navigate_to_site()` para garantir:**
- Apenas 1 processo Chrome
- Apenas 1 aba
- Ambiente 100% limpo entre sites

### 2. Ativacao da Janela via xdotool (oauth_session_manager.py)

```python
# Apos navegacao, ativar janela no VNC
subprocess.run(
    ["xdotool", "search", "--name", "Chrome", "windowactivate", "--sync",
     "windowraise", "windowmove", "0", "0"],
    capture_output=True, timeout=5, env={"DISPLAY": ":99"}
)
```

### 3. Limpeza de Locks no Startup (vnc-startup.sh)

```bash
# Clean up stale lock files from previous runs
echo "Cleaning up stale X11 locks..."
rm -f /tmp/.X99-lock /tmp/.X11-unix/X99 2>/dev/null || true

# Kill any orphaned processes from previous runs
echo "Killing orphaned processes..."
pkill -f Xvfb 2>/dev/null || true
pkill -f x11vnc 2>/dev/null || true
pkill -f fluxbox 2>/dev/null || true
pkill -f chrome 2>/dev/null || true
pkill -f chromedriver 2>/dev/null || true
sleep 1
```

### 2. Health Check do Chrome (oauth_session_manager.py)

```python
def is_chrome_alive(self) -> bool:
    """Verificar se o Chrome ainda esta vivo e respondendo."""
    if not self.driver:
        return False
    try:
        _ = self.driver.current_url
        _ = self.driver.title
        return True
    except Exception as e:
        logger.error(f"[HEALTH] Chrome NAO esta respondendo: {e}")
        return False

def ensure_chrome_alive(self) -> bool:
    """Garantir que Chrome esta vivo, reiniciando se necessario."""
    if self.is_chrome_alive():
        return True
    logger.warning("[HEALTH] Chrome morto detectado - tentando reiniciar...")
    try:
        if self.driver:
            self.driver.quit()
    except:
        pass
    self.driver = None
    return self.start_chrome()
```

### 3. Window Sizing Explicito

```python
# IMPORTANTE: Forcar tamanho da janela apos criacao
# Sem window manager, --start-maximized nao funciona
try:
    self.driver.set_window_position(0, 0)
    self.driver.set_window_size(1920, 1080)
except Exception as win_err:
    logger.warning(f"Nao foi possivel redimensionar janela: {win_err}")
```

### 4. Xdotool para Manipulacao de Janelas (Dockerfile)

```dockerfile
# X11 utilities for window management
xdotool \
x11-utils \
```

## Arquivos Modificados

1. `backend/python-scrapers/docker/vnc-startup.sh` - Limpeza de locks
2. `backend/python-scrapers/oauth_session_manager.py` - Health check + window sizing
3. `backend/python-scrapers/Dockerfile` - xdotool + x11-utils
4. `backend/api-service/controllers/oauth_controller.py` - Usar get_session_status()

## Procedimento de Recovery

Se o problema ocorrer novamente:

```bash
# 1. Parar e remover containers
docker-compose stop scrapers api-service
docker-compose rm -f scrapers api-service

# 2. Reiniciar scrapers primeiro
docker-compose up -d scrapers
sleep 15

# 3. Depois api-service
docker-compose up -d api-service
sleep 10

# 4. Verificar saude
curl http://localhost:8000/health
curl http://localhost:8000/api/oauth/session/status
```

## Resultado Final

- **21/21 sites** processados automaticamente
- **315 cookies** coletados
- **0 falhas**
- **~43 minutos** de duracao total
- Cookies salvos em `/app/browser-profiles/google_cookies.pkl`

## Prevencao

1. SEMPRE reiniciar scrapers ANTES de api-service
2. Usar `docker-compose rm -f` ao invés de apenas restart
3. Verificar `chrome_alive: true` na resposta da API antes de operar
4. Monitorar logs do scrapers para erros de Xvfb
