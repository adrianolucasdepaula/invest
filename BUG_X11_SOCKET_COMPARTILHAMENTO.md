# BUG: X11 Socket Compartilhamento Entre Containers

**Data:** 2025-11-25
**Severidade:** CRITICA
**Status:** RESOLVIDO
**Tempo de Resolucao:** ~2 horas

---

## Sintomas Observados

1. **Chrome nao aparecia no VNC** - Navegacao via API retornava sucesso, mas VNC mostrava tela vazia ou site anterior
2. **Processos Chrome em estado zombie** - `ps aux` mostrava `[chrome] <defunct>`
3. **Navegacao parecia funcionar** - API retornava `{"success": true}` mas browser nao mudava
4. **Sessao OAuth travada** - Ficava presa em site anterior (fundamentei.io) mesmo apos comandos de navegacao

---

## Causa Raiz

### Arquitetura do Problema

```
┌─────────────────────────────────────────────────────────────────┐
│                    ANTES DO FIX (QUEBRADO)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐         ┌─────────────────┐               │
│  │   SCRAPERS      │         │   API-SERVICE   │               │
│  │                 │         │                 │               │
│  │  Xvfb :99  ────────────── │  Chrome         │               │
│  │  x11vnc        │  REDE    │  DISPLAY=:99    │               │
│  │  noVNC         │ APENAS   │                 │               │
│  │                 │         │  /tmp/.X11-unix │ <- VAZIO!     │
│  │  /tmp/.X11-unix/X99       │  (nao compartilhado)            │
│  └─────────────────┘         └─────────────────┘               │
│                                                                 │
│  network_mode: "service:scrapers" compartilha APENAS a rede,   │
│  NAO o filesystem! Chrome nao conseguia acessar o socket X11.  │
└─────────────────────────────────────────────────────────────────┘
```

### Detalhes Tecnicos

1. **Xvfb** (X Virtual Framebuffer) roda no container `scrapers` e cria o socket em `/tmp/.X11-unix/X99`

2. **Chrome** roda no container `api-service` com `DISPLAY=:99`

3. **network_mode: "service:scrapers"** faz o api-service compartilhar a REDE do scrapers (mesmos IPs, portas), mas NAO o filesystem

4. **Resultado:** Chrome tentava conectar ao socket X11 em `/tmp/.X11-unix/X99` mas o diretorio estava VAZIO no api-service

5. **Comportamento:** Chrome crashava silenciosamente, processos ficavam em estado zombie `<defunct>`

---

## Solucao Implementada

### Mudancas no docker-compose.yml

```yaml
# 1. Adicionar volume ao servico scrapers (linha 237)
scrapers:
  volumes:
    - x11_socket:/tmp/.X11-unix  # NOVO

# 2. Adicionar volume ao servico api-service (linha 297)
api-service:
  volumes:
    - x11_socket:/tmp/.X11-unix  # NOVO

# 3. Declarar o volume (linha 517-518)
volumes:
  x11_socket:
    driver: local  # Compartilhar X11 socket entre scrapers e api-service
```

### Arquitetura Corrigida

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPOIS DO FIX (FUNCIONANDO)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐         ┌─────────────────┐               │
│  │   SCRAPERS      │         │   API-SERVICE   │               │
│  │                 │         │                 │               │
│  │  Xvfb :99  ─────┼─────────┼──> Chrome       │               │
│  │  x11vnc        │  REDE +  │  DISPLAY=:99    │               │
│  │  noVNC         │  VOLUME  │                 │               │
│  │                 │         │                 │               │
│  │  /tmp/.X11-unix/X99 <─────> /tmp/.X11-unix/X99              │
│  │         │                         │                         │
│  │         └─────── x11_socket ──────┘                         │
│  │                  (VOLUME COMPARTILHADO)                     │
│  └─────────────────┘         └─────────────────┘               │
│                                                                 │
│  Agora Chrome consegue acessar o socket X11 criado pelo Xvfb!  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Verificacao

### Comandos para Validar

```bash
# 1. Verificar volume existe
docker volume ls | grep x11
# Esperado: invest-claude-web_x11_socket

# 2. Verificar socket no scrapers
docker exec invest_scrapers ls -la /tmp/.X11-unix/
# Esperado: X99 socket presente

# 3. Verificar socket no api-service
docker exec invest_api_service ls -la /tmp/.X11-unix/
# Esperado: X99 socket presente (mesmo que scrapers)

# 4. Verificar Xvfb rodando
docker exec invest_scrapers ps aux | grep Xvfb
# Esperado: Xvfb :99 -screen 0 1920x1080x24 ...

# 5. Verificar Chrome consegue conectar
docker exec invest_api_service python -c "
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import os
print(f'DISPLAY={os.environ.get(\"DISPLAY\")}')
opts = Options()
opts.add_argument('--no-sandbox')
driver = webdriver.Chrome(options=opts)
print('Chrome OK!')
driver.quit()
"
```

---

## Prevencao Futura

### Checklist para Novos Servicos com GUI

- [ ] Se o servico usa `DISPLAY=:XX`, precisa de acesso ao socket X11
- [ ] Se usa `network_mode: "service:X"`, lembrar que SO REDE e compartilhada
- [ ] Compartilhar `/tmp/.X11-unix` via named volume entre containers
- [ ] Testar visualmente (VNC) apos mudancas em containers GUI

### Sinais de Alerta

1. **Processos `<defunct>`** - Indica crash silencioso
2. **API retorna sucesso mas VNC nao muda** - Desconexao entre backend e display
3. **Chrome crashes sem erro** - Falta de acesso ao X11

---

## Arquivos Modificados

| Arquivo | Linhas | Descricao |
|---------|--------|-----------|
| docker-compose.yml | +3 | Volume x11_socket adicionado |

---

## Licoes Aprendidas

1. **`network_mode` != filesystem sharing** - Compartilhar rede NAO compartilha volumes/filesystem
2. **X11 requer Unix socket** - Nao e possivel usar X11 apenas via TCP em containers Docker facilmente
3. **Named volumes para IPC** - Usar volumes nomeados para comunicacao inter-processo (IPC) entre containers
4. **Testar visualmente** - Sempre validar GUI com screenshots/VNC apos mudancas

---

## Referencias

- [Docker network_mode documentation](https://docs.docker.com/compose/compose-file/compose-file-v3/#network_mode)
- [X11 forwarding in Docker](https://wiki.ros.org/docker/Tutorials/GUI)
- [Unix socket sharing between containers](https://stackoverflow.com/questions/36249744/interacting-with-the-x-server-from-docker-containers)
