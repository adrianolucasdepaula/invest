# Python Scrapers Service

Serviço de scrapers Python para coletar dados financeiros de múltiplas fontes.

## 📋 Visão Geral

Este serviço complementa os scrapers TypeScript do backend NestJS, oferecendo:
- **Selenium WebDriver** para sites com JavaScript pesado
- **Execução assíncrona** com retry automático
- **Integração Redis** para job queues
- **PostgreSQL** para persistência de dados
- **Logging estruturado** com Loguru

## 🏗️ Arquitetura

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Backend   │────▶│    Redis    │◀────│   Python    │
│  (NestJS)   │     │   (Queue)   │     │  Scrapers   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                    │                    │
       └────────────────────┴────────────────────┘
                            │
                      ┌─────▼──────┐
                      │ PostgreSQL │
                      └────────────┘
```

### Fluxo de Dados

1. **Backend NestJS** envia job para Redis: `lpush scraper:jobs <job>`
2. **Python Scrapers** escuta a fila e processa jobs
3. **Scraper executa** com retry automático
4. **Resultado salvo** no PostgreSQL
5. **Evento publicado** no Redis: `publish scraper:results <result>`

## 📁 Estrutura de Arquivos

```
backend/python-scrapers/
├── Dockerfile              # Imagem Docker com Python + Chrome
├── requirements.txt        # Dependências Python
├── config.py              # Configurações (env vars)
├── database.py            # Cliente PostgreSQL
├── redis_client.py        # Cliente Redis
├── base_scraper.py        # Classe base abstrata
├── main.py                # Serviço principal
└── scrapers/              # Scrapers específicos
    ├── __init__.py
    └── statusinvest_scraper.py
```

## 🚀 Como Usar

### Executar com Docker Compose (Recomendado)

```bash
# Build e start de todos os serviços
docker-compose up -d --build

# Ver logs dos scrapers
docker-compose logs -f scrapers

# Status
docker-compose ps scrapers
```

### Executar Localmente (Desenvolvimento)

```bash
# 1. Instalar dependências
pip install -r requirements.txt

# 2. Configurar variáveis de ambiente
export DB_HOST=localhost
export DB_PORT=5532
export REDIS_HOST=localhost
export REDIS_PORT=6479

# 3. Executar
python main.py
```

## 📤 Enviar Job de Scraping

### Via Redis CLI

```bash
redis-cli -p 6479
LPUSH scraper:jobs '{"ticker":"PETR4","source":"STATUSINVEST","job_id":"123"}'
```

### Via Python

```python
import redis
import json

client = redis.Redis(host='localhost', port=6479, decode_responses=True)

job = {
    "ticker": "PETR4",
    "source": "STATUSINVEST",
    "job_id": "uuid-here",
    "timestamp": "2024-01-01T00:00:00"
}

client.lpush("scraper:jobs", json.dumps(job))
```

### Via Backend NestJS

```typescript
@Injectable()
export class ScrapersService {
  constructor(@InjectQueue('scrapers') private queue: Queue) {}

  async scrapeStock(ticker: string) {
    await this.queue.add('scrape', {
      ticker,
      source: 'STATUSINVEST',
      job_id: uuidv4(),
      timestamp: new Date().toISOString(),
    });
  }
}
```

## 🔍 Scrapers Disponíveis

### StatusInvest

Coleta dados fundamentalistas:
- Preço atual
- Dividend Yield (DY)
- P/L (Price/Earnings)
- P/VP (Price/Book Value)
- ROE, ROIC
- Liquidez
- Valor de mercado

**Uso:**
```json
{
  "ticker": "PETR4",
  "source": "STATUSINVEST"
}
```

## 🛠️ Adicionar Novo Scraper

### 1. Criar classe do scraper

```python
# scrapers/meu_scraper.py
from base_scraper import BaseScraper, ScraperResult

class MeuScraper(BaseScraper):
    def __init__(self):
        super().__init__(
            name="MeuScraper",
            source="MEU_SOURCE",
            requires_login=False
        )

    async def scrape(self, ticker: str) -> ScraperResult:
        # Criar driver se necessário
        if not self.driver:
            self.driver = self._create_driver()

        # Navegar e extrair dados
        url = f"https://example.com/{ticker}"
        self.driver.get(url)

        # ... lógica de extração ...

        return ScraperResult(
            success=True,
            data={"price": 10.50},
            source=self.source
        )
```

### 2. Registrar no service

```python
# main.py
from scrapers.meu_scraper import MeuScraper

class ScraperService:
    def _register_scrapers(self):
        self.scrapers["STATUSINVEST"] = StatusInvestScraper
        self.scrapers["MEU_SOURCE"] = MeuScraper  # Adicionar aqui
```

### 3. Rebuild e testar

```bash
docker-compose up -d --build scrapers
docker-compose logs -f scrapers
```

## ⚙️ Configuração

Variáveis de ambiente disponíveis:

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `DB_HOST` | `localhost` | Host do PostgreSQL |
| `DB_PORT` | `5432` | Porta do PostgreSQL |
| `DB_USERNAME` | `invest_user` | Usuário do banco |
| `DB_PASSWORD` | `invest_password` | Senha do banco |
| `DB_DATABASE` | `invest_db` | Nome do banco |
| `REDIS_HOST` | `localhost` | Host do Redis |
| `REDIS_PORT` | `6379` | Porta do Redis |
| `CHROME_HEADLESS` | `true` | Chrome em modo headless |
| `SCRAPER_TIMEOUT` | `30000` | Timeout em ms |
| `SCRAPER_MAX_RETRIES` | `3` | Máximo de tentativas |
| `LOG_LEVEL` | `INFO` | Nível de log |

## 📊 Logs

Logs são salvos em:
- **Console:** stdout (colorido)
- **Arquivo:** `/app/logs/scrapers.log` (rotação 10MB, 7 dias)

Formato:
```
2024-01-01 12:00:00 | INFO     | scraper:scrape - [StatusInvest] Scraping PETR4...
2024-01-01 12:00:05 | SUCCESS  | scraper:scrape - Successfully scraped PETR4 in 5.2s
```

## 🐛 Debugging

### Ver logs em tempo real

```bash
docker-compose logs -f scrapers
```

### Executar comando dentro do container

```bash
docker-compose exec scrapers bash
python -c "from config import settings; print(settings.database_url)"
```

### Testar scraper manualmente

```python
import asyncio
from scrapers import StatusInvestScraper

async def test():
    scraper = StatusInvestScraper()
    result = await scraper.scrape_with_retry("PETR4")
    print(result.to_dict())

asyncio.run(test())
```

## 🚨 Troubleshooting

### Chrome não inicia

```bash
# Verificar se Chrome está instalado
docker-compose exec scrapers google-chrome --version

# Verificar ChromeDriver
docker-compose exec scrapers chromedriver --version
```

### Erro de conexão com PostgreSQL/Redis

```bash
# Verificar se serviços estão rodando
docker-compose ps postgres redis

# Testar conexão manualmente
docker-compose exec scrapers python -c "from database import db; db.connect(); print('OK')"
docker-compose exec scrapers python -c "from redis_client import redis_client; redis_client.connect(); print('OK')"
```

### Timeout ao fazer scraping

- Aumentar `SCRAPER_TIMEOUT` (em ms)
- Verificar velocidade da internet
- Verificar se site está acessível

## 📈 Performance

Configurações recomendadas para produção:

```yaml
# docker-compose.yml
scrapers:
  deploy:
    resources:
      limits:
        cpus: '2.0'
        memory: 2G
      reservations:
        cpus: '0.5'
        memory: 512M
  environment:
    - SCRAPER_CONCURRENT_JOBS=3  # Jobs simultâneos
    - SCRAPER_MAX_RETRIES=3
    - CHROME_HEADLESS=true
```

## 📝 Licença

Parte do projeto B3 AI Analysis Platform.
