# Convenções de Código - B3 AI Analysis Platform

**Projeto:** B3 AI Analysis Platform (invest-claude-web)
**Última Atualização:** 2025-12-15
**Versão:** 1.12.3

---

## 📑 ÍNDICE

1. [TypeScript](#typescript)
2. [NestJS (Backend)](#nestjs-backend)
3. [Next.js (Frontend)](#nextjs-frontend)
4. [Git & Commits](#git--commits)
5. [Documentação](#documentação)
6. [Padrões de Projeto](#padrões-de-projeto)

---

## 🔷 TypeScript

### Naming Conventions

| Tipo                  | Convenção               | Exemplo                   | ❌ Evitar                                    |
| --------------------- | ----------------------- | ------------------------- | -------------------------------------------- |
| **Files**             | kebab-case              | `user-profile.service.ts` | `UserProfile.service.ts`, `user_profile.ts`  |
| **Classes**           | PascalCase              | `UserProfileService`      | `userProfileService`, `User_Profile_Service` |
| **Interfaces**        | PascalCase + `I` prefix | `IUserProfile`            | `UserProfile`, `userProfile`                 |
| **Types**             | PascalCase              | `AssetPrice`              | `assetPrice`, `asset_price`                  |
| **Functions/Methods** | camelCase               | `getUserProfile()`        | `GetUserProfile()`, `get_user_profile()`     |
| **Variables**         | camelCase               | `currentPrice`            | `CurrentPrice`, `current_price`              |
| **Constants**         | UPPER_SNAKE_CASE        | `MAX_RETRIES`             | `maxRetries`, `MaxRetries`                   |
| **Enums**             | PascalCase (singular)   | `UserRole`                | `UserRoles`, `user_role`                     |
| **Enum Values**       | UPPER_SNAKE_CASE        | `ADMIN`, `USER`           | `Admin`, `User`                              |

### Code Style

```typescript
// ✅ CORRETO

// Indentation: 2 spaces
export class AssetService {
  constructor(private readonly assetRepository: Repository<Asset>) {}

  async findByTicker(ticker: string): Promise<Asset> {
    return await this.assetRepository.findOne({ where: { ticker } });
  }
}

// Quotes: Single quotes
const message = "Hello World";
const ticker = "PETR4";

// Semicolons: Obrigatórios
const price = 28.45;
const change = -1.23;

// Line length: Máximo 100 caracteres
const longMessage =
  "This is a very long message that exceeds 100 characters " +
  "so we break it into multiple lines";

// Equality: Strict
if (ticker === "PETR4") {
} // ✅
if (price !== 0) {
} // ✅

// ❌ ERRADO
if (ticker == "PETR4") {
} // ❌ Usar ===
if (price != 0) {
} // ❌ Usar !==
```

### Imports

**Ordem Obrigatória:**

```typescript
// 1. Node modules (built-in)
import * as fs from "fs";
import * as path from "path";

// 2. External libraries
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

// 3. Aliases internos (@api, @database, @scrapers)
import { UserService } from "@api/users/user.service";
import { Asset } from "@database/entities/asset.entity";
import { ScrapersService } from "@scrapers/scrapers.service";

// 4. Relativos (evitar quando possível)
import { helper } from "./helper";
import { utils } from "../utils";
```

### Types vs Interfaces

```typescript
// ✅ Prefer INTERFACES para objetos
interface IUserProfile {
  id: number;
  name: string;
  email: string;
}

// ✅ Prefer TYPES para unions, intersections, primitives
type Status = "active" | "inactive" | "pending";
type Nullable<T> = T | null;
type UserWithRole = IUserProfile & { role: UserRole };
```

### Explicit Return Types

```typescript
// ✅ CORRETO: Return type explícito em métodos públicos
export class AssetService {
  async findById(id: number): Promise<Asset> {
    return await this.assetRepository.findOne({ where: { id } });
  }

  calculateChange(current: number, previous: number): number {
    return ((current - previous) / previous) * 100;
  }
}

// ⚠️ Métodos privados podem omitir (mas recomendado incluir)
private async loadCache() {
  // ...
}
```

### NO `any`

```typescript
// ❌ ERRADO
function process(data: any) {
  return data.value;
}

// ✅ CORRETO: Usar unknown e type guards
function process(data: unknown): number {
  if (typeof data === "object" && data !== null && "value" in data) {
    return (data as { value: number }).value;
  }
  throw new Error("Invalid data");
}

// ✅ MELHOR: Generic
function process<T extends { value: number }>(data: T): number {
  return data.value;
}
```

---

## 🟦 NestJS (Backend)

### Estrutura de Módulos

```typescript
// ✅ Um módulo por feature
@Module({
  imports: [TypeOrmModule.forFeature([Asset, AssetPrice]), HttpModule],
  controllers: [AssetsController],
  providers: [AssetsService, AssetsUpdateService],
  exports: [AssetsService], // Export apenas o que será usado fora
})
export class AssetsModule {}
```

### Services

```typescript
// ✅ Padrão de Service
@Injectable()
export class AssetService {
  private readonly logger = new Logger(AssetService.name);

  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    private readonly httpService: HttpService
  ) {}

  /**
   * Busca ativo por ticker
   * @param ticker Código do ticker (ex: PETR4)
   * @returns Asset encontrado
   * @throws NotFoundException se não encontrar
   */
  async findByTicker(ticker: string): Promise<Asset> {
    const asset = await this.assetRepository.findOne({
      where: { ticker: ticker.toUpperCase() },
    });

    if (!asset) {
      throw new NotFoundException(`Asset ${ticker} not found`);
    }

    this.logger.log(`Asset ${ticker} retrieved successfully`);
    return asset;
  }
}
```

### Controllers

```typescript
// ✅ Endpoints RESTful
@Controller("api/v1/assets")
@UseGuards(JwtAuthGuard)
export class AssetsController {
  constructor(private readonly assetsService: AssetService) {}

  @Get(":ticker")
  @ApiOperation({ summary: "Get asset by ticker" })
  @ApiResponse({ status: 200, type: AssetResponseDto })
  async getByTicker(
    @Param("ticker") ticker: string
  ): Promise<AssetResponseDto> {
    const asset = await this.assetsService.findByTicker(ticker);
    return new AssetResponseDto(asset);
  }

  @Post()
  @ApiOperation({ summary: "Create new asset" })
  @ApiResponse({ status: 201, type: AssetResponseDto })
  async create(@Body() dto: CreateAssetDto): Promise<AssetResponseDto> {
    const asset = await this.assetsService.create(dto);
    return new AssetResponseDto(asset);
  }
}
```

### DTOs (Data Transfer Objects)

```typescript
// ✅ DTO com validação
export class CreateAssetDto {
  @ApiProperty({ example: "PETR4" })
  @IsString()
  @IsNotEmpty()
  @Length(5, 6)
  ticker: string;

  @ApiProperty({ example: "Petrobras PN" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: "Ação" })
  @IsEnum(["Ação", "FII", "BDR"])
  type: string;
}

// ✅ Response DTO
export class AssetResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  ticker: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  type: string;

  constructor(asset: Asset) {
    this.id = asset.id;
    this.ticker = asset.ticker;
    this.name = asset.name;
    this.type = asset.type;
  }
}
```

### Entities (TypeORM)

```typescript
// ✅ Entity completa
@Entity("assets")
@Index(["ticker"], { unique: true })
export class Asset extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 6, unique: true })
  ticker: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: "enum", enum: ["Ação", "FII", "BDR"] })
  type: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  currentPrice: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relações
  @OneToMany(() => AssetPrice, (price) => price.asset)
  prices: AssetPrice[];

  @ManyToMany(() => Portfolio, (portfolio) => portfolio.assets)
  portfolios: Portfolio[];
}
```

---

## 🟩 Next.js (Frontend)

### Componentescomponents

```typescript
// ✅ Functional component com TypeScript
interface AssetCardProps {
  ticker: string;
  currentPrice: number;
  change: number;
  changePercent: number;
}

export function AssetCard({
  ticker,
  currentPrice,
  change,
  changePercent,
}: AssetCardProps) {
  const isPositive = change >= 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{ticker}</span>
          <Badge variant={isPositive ? "success" : "destructive"}>
            {isPositive ? "↑" : "↓"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">R$ {currentPrice.toFixed(2)}</p>
        <p className={isPositive ? "text-green-600" : "text-red-600"}>
          {change >= 0 ? "+" : ""}
          {change.toFixed(2)}({changePercent.toFixed(2)}%)
        </p>
      </CardContent>
    </Card>
  );
}

// ❌ EVITAR class components
class AssetCard extends React.Component {} // ❌
```

### Hooks

```typescript
// ✅ Custom hooks com prefix 'use'
export function useAssetData(ticker: string) {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAsset() {
      try {
        setLoading(true);
        const response = await fetch(`/api/assets/${ticker}`);
        const data = await response.json();
        setAsset(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAsset();
  }, [ticker]);

  return { asset, loading, error };
}

// Uso
function AssetPage({ ticker }: { ticker: string }) {
  const { asset, loading, error } = useAssetData(ticker);

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;
  if (!asset) return <NotFound />;

  return <AssetCard {...asset} />;
}
```

### App Router (Next.js 14)

```typescript
// ✅ Server Component (padrão)
// app/(dashboard)/assets/[ticker]/page.tsx
export default async function AssetPage({
  params,
}: {
  params: { ticker: string };
}) {
  const asset = await getAsset(params.ticker);

  return <AssetDetail asset={asset} />;
}

// ✅ Client Component (quando necessário)
("use client");

import { useState } from "react";

export function AssetChart({ ticker }: { ticker: string }) {
  const [timeframe, setTimeframe] = useState("1M");

  return (
    <div>
      <TimeframeSelector value={timeframe} onChange={setTimeframe} />
      <Chart ticker={ticker} timeframe={timeframe} />
    </div>
  );
}
```

---

## 🔶 Git & Commits

### Conventional Commits

**Formato:** `type(scope): description`

**Types:**

- `feat`: Nova feature
- `fix`: Correção de bug
- `docs`: Apenas documentação
- `style`: Formatação (sem mudança de lógica)
- `refactor`: Refatoração de código
- `test`: Adicionar/modificar testes
- `chore`: Tarefas de build, configs, etc

**Exemplos:**

```bash
# ✅ CORRETO
feat(assets): add ticker history merge functionality
fix(portfolio): calculate correct gain of day
docs(readme): update installation steps
refactor(scrapers): improve error handling
test(assets): add unit tests for AssetService
chore(deps): update dependencies

# ❌ ERRADO
Add ticker merge  # Sem type/scope
fix: bug  # Description muito vaga
FEAT(Assets): Add Ticker Merge  # Type/scope em maiúscula
```

### Branches

```bash
# ✅ Naming de branches
main                           # Produção
develop                        # Desenvolvimento
feature/ticker-history-merge   # Nova feature
bugfix/portfolio-gain-calc     # Correção de bug
hotfix/security-vulnerability  # Correção urgente produção
release/v1.2.0                 # Release

# ❌ EVITAR
my-feature  # Não descritivo
FEATURE-123  # Uppercase
feature_123  # Underscores
```

### Commit Messages

```bash
# ✅ Boas mensagens de commit
git commit -m "feat(assets): add cross-validation for fundamentalist data

- Implement 3+ sources minimum requirement
- Add outlier detection with 10% threshold
- Calculate confidence score (0.0 - 1.0)
- Update ScrapersService.mergeResults() method

Refs: ROADMAP.md FASE 55"

# ❌ Más mensagens
git commit -m "fix"
git commit -m "WIP"
git commit -m "asdf"
```

---

## 📝 Documentação

### JSDoc para Métodos Públicos

````typescript
/**
 * Busca ativo por ticker com validação de dados cross-validation
 *
 * @param ticker - Código do ticker (ex: PETR4, VALE3)
 * @param options - Opções de busca
 * @param options.includeHistory - Incluir histórico de preços
 * @param options.validate - Validar com cross-validation
 * @returns Promise com o Asset encontrado
 * @throws {NotFoundException} Se o ticker não for encontrado
 * @throws {ValidationException} Se a validação cross-validation falhar
 *
 * @example
 * ```typescript
 * const asset = await assetService.findByTicker('PETR4', {
 *   includeHistory: true,
 *   validate: true
 * });
 * ```
 */
async findByTicker(
  ticker: string,
  options?: FindOptions
): Promise<Asset> {
  // ...
}
````

### README.md de Módulos

````markdown
# Assets Module

Módulo responsável por gerenciar ativos B3 (ações, FIIs, BDRs).

## Features

- ✅ CRUD de ativos
- ✅ Sincronização com BRAPI
- ✅ Cross-validation de dados fundamentalistas
- ✅ Histórico de preços

## Endpoints

- `GET /api/v1/assets` - Listar todos os ativos
- `GET /api/v1/assets/:ticker` - Buscar por ticker
- `POST /api/v1/assets` - Criar novo ativo
- `PUT /api/v1/assets/:ticker` - Atualizar ativo
- `DELETE /api/v1/assets/:ticker` - Deletar ativo

## Uso

```typescript
import { AssetsService } from "@api/assets/assets.service";

const asset = await assetsService.findByTicker("PETR4");
```
````

````

---

## 🎨 Padrões de Projeto

### Repository Pattern

```typescript
// ✅ Usar repository do TypeORM
@Injectable()
export class AssetService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
  ) {}

  async findAll(): Promise<Asset[]> {
    return await this.assetRepository.find();
  }
}

// ❌ EVITAR queries diretas no controller
@Get()
async getAll() {
  return await this.dataSource.query('SELECT * FROM assets'); // ❌
}
````

### Dependency Injection

```typescript
// ✅ Injetar dependências via constructor
@Injectable()
export class AssetService {
  constructor(
    private readonly assetRepository: Repository<Asset>,
    private readonly scrapersService: ScrapersService,
    private readonly logger: Logger
  ) {}
}

// ❌ EVITAR instâncias diretas
class AssetService {
  private scrapersService = new ScrapersService(); // ❌
}
```

### Error Handling

```typescript
// ✅ Exceptions do NestJS
if (!asset) {
  throw new NotFoundException(`Asset ${ticker} not found`);
}

if (!isValid) {
  throw new BadRequestException("Invalid ticker format");
}

if (!hasPermission) {
  throw new UnauthorizedException("Insufficient permissions");
}

// ❌ EVITAR throw genérico
throw new Error("Not found"); // ❌
```

---

## 🔗 Referências

-`CONTRIBUTING.md` - Workflow Git completo

- `CHECKLIST_CODE_REVIEW_COMPLETO.md` - Checklist de review
- `.gemini/context/financial-rules.md` - Regras financeiras
- `ARCHITECTURE.md` - Arquitetura do sistema

---

**Última Atualização:** 2025-12-15
**Mantenedor:** Claude Code (Opus 4.5) + Google Gemini 3 Pro
