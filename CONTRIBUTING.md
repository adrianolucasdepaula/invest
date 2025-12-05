# 🤝 CONTRIBUTING - B3 AI Analysis Platform

**Projeto:** B3 AI Analysis Platform (invest-claude-web)
**Última Atualização:** 2025-11-14
**Versão:** 1.0.0
**Mantenedor:** Claude Code (Sonnet 4.5)

---

## 📑 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Convenções de Código](#convenções-de-código)
3. [Git Workflow](#git-workflow)
4. [Decisões Técnicas](#decisões-técnicas)
5. [Como Contribuir](#como-contribuir)

---

## 🎯 VISÃO GERAL

Este documento define as convenções de código, workflow de Git e decisões técnicas que devem ser seguidas por todos os colaboradores do projeto B3 AI Analysis Platform.

### Princípios de Contribuição

- ✅ **Qualidade > Velocidade**: Zero tolerance para erros TypeScript e build
- ✅ **Documentação Completa**: Toda feature deve ser documentada
- ✅ **Testes Obrigatórios**: Mínimo 80% de coverage
- ✅ **Code Review**: Todas as mudanças passam por review
- ✅ **Conventional Commits**: Mensagens padronizadas
- ✅ **Co-autoria**: Sempre incluir `Co-Authored-By` quando aplicável

---

## 📝 CONVENÇÕES DE CÓDIGO

### TypeScript

#### Nomenclatura

Seguir rigorosamente as convenções abaixo:

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| **Classes** | `PascalCase` | `AssetService`, `AnalysisController` |
| **Interfaces** | `PascalCase` (prefixo `I` opcional) | `IAssetRepository`, `AssetRepository` |
| **Enums** | `PascalCase` | `AssetType`, `AnalysisStatus` |
| **Variáveis/Funções** | `camelCase` | `findAssetByTicker`, `calculateProfit` |
| **Constantes** | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT`, `API_BASE_URL` |
| **Arquivos** | `kebab-case` | `asset.service.ts`, `analysis.controller.ts` |

#### Imports

**Sempre usar path aliases** configurados em `tsconfig.json`:

```typescript
// ✅ CORRETO - Path absoluto com alias
import { AssetService } from '@api/assets/asset.service';
import { Asset } from '@database/entities';
import { CreateAssetDto } from '@api/assets/dto';

// ❌ INCORRETO - Path relativo
import { AssetService } from '../../../api/assets/asset.service';
import { Asset } from '../../database/entities';
```

**Aliases configurados:**
- `@api/*` → `src/api/*`
- `@database/*` → `src/database/*`
- `@scrapers/*` → `src/scrapers/*`
- `@/` (frontend) → `src/*`

#### DTOs (Data Transfer Objects)

**Sempre usar decorators** de `class-validator` e `class-transformer`:

```typescript
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { AssetType } from '@database/entities';

export class CreateAssetDto {
  @IsString()
  @IsNotEmpty()
  ticker: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsEnum(AssetType)
  @IsNotEmpty()
  type: AssetType;
}
```

**Regras:**
- DTO para **toda** entrada de API (POST, PUT, PATCH)
- DTO para **toda** saída de API (response)
- Validação **sempre** no controller
- Transformação **sempre** no service

#### Enums

**Sempre usar enums** ao invés de strings literais:

```typescript
// ✅ CORRETO
export enum AssetType {
  STOCK = 'stock',
  FII = 'fii',
  ETF = 'etf',
  CRYPTO = 'crypto',
}

// ❌ INCORRETO
type AssetType = 'stock' | 'fii' | 'etf' | 'crypto';
```

#### Error Handling

**Sempre usar exceptions** do NestJS:

```typescript
import { NotFoundException, BadRequestException } from '@nestjs/common';

// ✅ CORRETO
async findAssetByTicker(ticker: string): Promise<Asset> {
  const asset = await this.assetRepo.findOne({ where: { ticker } });
  if (!asset) {
    throw new NotFoundException(`Asset ${ticker} not found`);
  }
  return asset;
}

// ❌ INCORRETO
async findAssetByTicker(ticker: string): Promise<Asset | null> {
  const asset = await this.assetRepo.findOne({ where: { ticker } });
  return asset; // Retorna null sem indicar erro
}
```

#### Async/Await

**Sempre preferir** async/await ao invés de promises:

```typescript
// ✅ CORRETO
async getAssets(): Promise<Asset[]> {
  const assets = await this.assetRepo.find();
  return assets;
}

// ❌ INCORRETO
getAssets(): Promise<Asset[]> {
  return this.assetRepo.find().then(assets => assets);
}
```

---

### Frontend (Next.js + React)

#### Componentes

**Estrutura padrão** de componentes:

```typescript
'use client'; // Se necessário (para interação)

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface AssetCardProps {
  ticker: string;
  name: string;
  price: number;
  onSelect?: (ticker: string) => void;
}

export function AssetCard({ ticker, name, price, onSelect }: AssetCardProps) {
  const [isSelected, setIsSelected] = useState(false);

  const handleClick = () => {
    setIsSelected(!isSelected);
    onSelect?.(ticker);
  };

  return (
    <div className="p-4 border rounded">
      <h3>{ticker}</h3>
      <p>{name}</p>
      <p>R$ {price.toFixed(2)}</p>
      <Button onClick={handleClick}>
        {isSelected ? 'Selecionado' : 'Selecionar'}
      </Button>
    </div>
  );
}
```

**Regras:**
- Componentes em `PascalCase`
- Props interface **sempre** definida
- Props desestruturadas no parâmetro
- Export named (não default)

#### Hooks Customizados

**Padrão de hooks customizados:**

```typescript
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface UseAssetsReturn {
  assets: Asset[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useAssets(): UseAssetsReturn {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAssets = async () => {
    try {
      setIsLoading(true);
      const data = await api.assets.getAll();
      setAssets(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  return {
    assets,
    isLoading,
    error,
    refetch: fetchAssets,
  };
}
```

**Regras:**
- Nome começa com `use`
- Retorno tipado com interface
- Error handling completo
- Incluir `refetch` quando aplicável

#### Tailwind CSS

**Ordem de classes** (seguir ordem lógica):

```typescript
// ✅ CORRETO - Ordem: Layout → Spacing → Typography → Visual → State
<div className="flex flex-col gap-4 p-6 text-lg font-semibold bg-white rounded-lg shadow-md hover:shadow-lg">

// ❌ INCORRETO - Ordem aleatória
<div className="bg-white hover:shadow-lg p-6 flex text-lg gap-4 rounded-lg shadow-md flex-col font-semibold">
```

---

## 🔀 GIT WORKFLOW

### Branches

Seguir GitFlow simplificado:

| Branch | Propósito | Exemplo |
|--------|-----------|---------|
| `main` | Produção (estável) | - |
| `develop` | Desenvolvimento (próximo release) | - |
| `feature/*` | Nova funcionalidade | `feature/portfolio-charts` |
| `fix/*` | Correção de bug | `fix/analysis-duplicated` |
| `docs/*` | Documentação | `docs/update-readme` |
| `refactor/*` | Refatoração | `refactor/reports-system` |

### Commits

**Seguir Conventional Commits rigorosamente:**

```bash
<tipo>: <descrição curta (max 72 caracteres)>

<corpo detalhado (opcional):
- Problema identificado
- Solução implementada
- Arquivos modificados
- Validações realizadas>

**Arquivos Modificados:**
- arquivo1.ts (+X linhas)
- arquivo2.tsx (-Y linhas)

**Validação:**
- ✅ TypeScript: 0 erros
- ✅ Build: Success
- ✅ Testes: Passando

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Tipos de commit:**

| Tipo | Uso | Exemplo |
|------|-----|---------|
| `feat` | Nova funcionalidade | `feat: Implementar análise em massa` |
| `fix` | Correção de bug | `fix: Corrigir cálculo de variação` |
| `docs` | Documentação | `docs: Adicionar CONTRIBUTING.md` |
| `refactor` | Refatoração (sem mudança de comportamento) | `refactor: Extrair lógica de validação` |
| `test` | Adição/correção de testes | `test: Adicionar testes para AssetService` |
| `chore` | Manutenção/config | `chore: Atualizar dependências` |
| `perf` | Melhoria de performance | `perf: Otimizar query de análises` |
| `style` | Formatação (sem lógica) | `style: Formatar código com prettier` |
| `ci` | CI/CD | `ci: Adicionar workflow de testes` |
| `build` | Build system | `build: Configurar esbuild` |

### Git Hooks (Husky)

O projeto usa **Husky** para automatizar validações antes de commits e pushes.

**Hooks configurados:**

| Hook | Validação | Quando Executa |
|------|-----------|----------------|
| `pre-commit` | TypeScript (0 erros) backend + frontend | Antes de cada commit |
| `commit-msg` | Conventional Commits format | Valida mensagem do commit |
| `pre-push` | Build completo backend + frontend | Antes de cada push |

**Bypass (apenas emergências):**

```bash
# Bypass pre-commit/commit-msg
git commit --no-verify -m "emergency fix"

# Bypass pre-push
git push --no-verify
```

**Instalação (automática):**

```bash
# Hooks são instalados automaticamente via npm prepare
npm install  # Na raiz do projeto
```

**Se hooks não funcionarem:**

```bash
# Reinstalar Husky
npx husky init
```

---

### Pull Requests

**Template obrigatório de PR:**

```markdown
## 📋 Descrição

[Descrição detalhada da mudança]

## 🎯 Tipo de Mudança

- [ ] Nova feature (feat)
- [ ] Correção de bug (fix)
- [ ] Refatoração (refactor)
- [ ] Documentação (docs)
- [ ] Outro: __________

## ✅ Checklist

- [ ] Código segue convenções do projeto
- [ ] TypeScript: 0 erros
- [ ] Build: Success
- [ ] Testes: Passando (ou N/A)
- [ ] Documentação atualizada (se aplicável)
- [ ] CLAUDE.md atualizado (se aplicável)
- [ ] Screenshots/GIFs incluídos (se mudança visual)

## 🔗 Issues Relacionadas

Closes #123

## 📸 Screenshots (se aplicável)

[Adicionar screenshots/GIFs]

## 🧪 Como Testar

1. Passo 1
2. Passo 2
3. Resultado esperado: ...

## 📝 Notas Adicionais

[Informações adicionais, breaking changes, etc]

---

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Regras:**
- **Sempre** incluir descrição detalhada
- **Sempre** linkar issue relacionada
- **Sempre** solicitar review de pelo menos 1 pessoa
- **Sempre** incluir co-autoria do Claude quando aplicável
- **Nunca** mergear PR sem review
- **Nunca** mergear PR com conflicts
- **Nunca** mergear PR com CI falhando

---

## 🧩 DECISÕES TÉCNICAS

Decisões arquiteturais tomadas no projeto e suas justificativas.

### 1. Por que NestJS no backend?

**Motivos:**
- ✅ Arquitetura modular e escalável (Modules, Services, Controllers)
- ✅ TypeScript nativo com decorators (`@Injectable`, `@Controller`)
- ✅ Integração fácil com TypeORM
- ✅ Swagger/OpenAPI automático via decorators
- ✅ Dependency Injection robusto (IoC container)
- ✅ Ecosystem maduro (Queue com BullMQ, WebSocket com Socket.io)
- ✅ Suporte a microservices (se necessário no futuro)

**Alternativas Consideradas:**
- ❌ Express.js: Muito low-level, sem opinião sobre arquitetura
- ❌ Fastify: Menos maduro, ecosystem menor
- ❌ Koa: Minimalista demais para projeto grande

---

### 2. Por que Next.js 14 App Router?

**Motivos:**
- ✅ Server Components para performance (SSR/SSG híbrido)
- ✅ Roteamento file-based intuitivo (`app/` directory)
- ✅ SSR e SSG nativos (SEO)
- ✅ TypeScript first-class (suporte nativo)
- ✅ Integração perfeita com Shadcn/ui
- ✅ Otimizações automáticas (image, font, bundle splitting)
- ✅ API Routes integradas (se necessário)

**Alternativas Consideradas:**
- ❌ Create React App: Deprecated, sem SSR
- ❌ Vite + React: Sem SSR nativo
- ❌ Remix: Menos maduro, ecosystem menor

---

### 3. Por que PostgreSQL?

**Motivos:**
- ✅ ACID compliant (confiabilidade total)
- ✅ JSON support para campos flexíveis (`metadata`)
- ✅ Indexes avançados (GIN para JSON, GiST para geolocalização)
- ✅ Window functions para análises (cálculos complexos)
- ✅ Extensões (`pg_stat_statements`, `pg_trgm`)
- ✅ Grátis e open-source (licença permissiva)
- ✅ Comunidade ativa e grande ecosystem

**Alternativas Consideradas:**
- ❌ MySQL: JSON support inferior, window functions limitadas
- ❌ MongoDB: Não relacional, dificulta queries complexas
- ❌ SQLite: Não adequado para produção multi-user

---

### 4. Por que BullMQ + Redis?

**Motivos:**
- ✅ Queue distribuída e escalável (horizontal scaling)
- ✅ Retry automático em falhas (exponential backoff)
- ✅ Rate limiting nativo (evita sobrecarga de scrapers)
- ✅ Dashboard de monitoramento (Bull Board)
- ✅ Priorização de jobs (alta, média, baixa)
- ✅ Agendamento de tarefas (cron jobs para atualização diária)
- ✅ TypeScript support nativo

**Alternativas Consideradas:**
- ❌ RabbitMQ: Mais complexo, overhead de memória maior
- ❌ Kafka: Overkill para o tamanho do projeto
- ❌ AWS SQS: Vendor lock-in, custo adicional

---

### 5. Por que Python para scrapers?

**Motivos:**
- ✅ Playwright melhor que Puppeteer (mais estável, multi-browser)
- ✅ BeautifulSoup4 para parsing HTML (simples e poderoso)
- ✅ Ecosystem rico para scraping (Scrapy, Selenium, etc)
- ✅ Requests/HTTPX para APIs públicas (simples e eficiente)
- ✅ Fácil integração com NestJS via API REST
- ✅ Community large para troubleshooting

**Alternativas Consideradas:**
- ❌ Puppeteer (Node.js): Menos estável, apenas Chromium
- ❌ Selenium (Node.js): Mais lento que Playwright
- ❌ Scrapy (Python): Overkill para scrapers simples

---

### 6. Por que TypeORM?

**Motivos:**
- ✅ TypeScript nativo (type safety total)
- ✅ Migrations automáticas (`npm run migration:generate`)
- ✅ Decorators para entidades (`@Entity`, `@Column`)
- ✅ QueryBuilder type-safe (autocomplete no IDE)
- ✅ Relacionamentos complexos (eager/lazy loading)
- ✅ Integração perfeita com NestJS (`@InjectRepository`)

**Alternativas Consideradas:**
- ❌ Prisma: Menos maduro, migrations menos flexíveis
- ❌ Sequelize: TypeScript support inferior
- ❌ Knex: Muito low-level, sem decorators

---

## 🤝 COMO CONTRIBUIR

### 1. Setup do Ambiente

```bash
# Clone o repositório
git clone https://github.com/adrianolucasdepaula/invest.git
cd invest-claude-web

# Instale dependências
cd backend && npm install
cd ../frontend && npm install

# Configure variáveis de ambiente
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# Suba os containers
docker-compose up -d

# Execute migrations
cd backend && npm run migration:run
```

### 2. Crie uma Branch

```bash
# Feature
git checkout -b feature/nome-da-feature

# Fix
git checkout -b fix/nome-do-bug

# Docs
git checkout -b docs/nome-do-documento
```

### 3. Faça as Mudanças

- Siga as **convenções de código** deste documento
- Escreva **commits** seguindo Conventional Commits
- Adicione **testes** (se aplicável)
- Atualize **documentação** (se aplicável)

### 4. Valide as Mudanças

```bash
# Backend
cd backend
npx tsc --noEmit    # 0 errors
npm run build       # Success
npm run test        # All pass (se aplicável)

# Frontend
cd frontend
npx tsc --noEmit    # 0 errors
npm run build       # Success
npm run test        # All pass (se aplicável)
```

### 5. Commit e Push

```bash
git add .
git commit -m "feat: Adicionar funcionalidade X"
git push origin feature/nome-da-feature
```

### 6. Abra Pull Request

- Acesse GitHub
- Clique em "New Pull Request"
- Preencha o **template de PR** completamente
- Solicite **review** de pelo menos 1 pessoa
- Aguarde aprovação e merge

---

## 📚 RECURSOS ADICIONAIS

### Documentação do Projeto

- **`ARCHITECTURE.md`** - Arquitetura completa do sistema
- **`DATABASE_SCHEMA.md`** - Schema do banco de dados
- **`ROADMAP.md`** - Histórico de desenvolvimento
- **`TROUBLESHOOTING.md`** - Guia de resolução de problemas
- **`claude.md`** - Instruções para Claude Code
- **`README.md`** - Documentação pública

### Documentação Externa

- **NestJS:** https://docs.nestjs.com
- **Next.js:** https://nextjs.org/docs
- **TypeORM:** https://typeorm.io
- **Conventional Commits:** https://www.conventionalcommits.org

---

**Última atualização:** 2025-11-14
**Mantido por:** Claude Code (Sonnet 4.5)
