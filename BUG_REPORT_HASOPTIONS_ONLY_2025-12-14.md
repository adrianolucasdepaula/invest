# Bug Report: hasOptionsOnly Filter Not Working

**Data:** 2025-12-14
**Status:** Root Cause Identificado, Fix em Validação
**Fase:** FASE 86 Follow-up

## Problema Reportado

Quando o checkbox "Com Opções" é marcado na página de Assets e o botão "Atualizar Todos" é clicado:
- **Esperado:** Enfileirar apenas ~153 ativos (aqueles com `hasOptions=true` no banco)
- **Atual:** Enfileira todos os 861 ativos

## Análise Profunda Realizada

### 1. Fluxo de Dados Analisado

```
Frontend (page.tsx)          API Client (api.ts)           Backend (controller.ts)
       │                           │                              │
showOnlyOptions: true ────► bulkUpdateAllAssets ────► @Body() BulkUpdateAllAssetsDto
       │                     hasOptionsOnly: true              │
       │                           │                    dto.hasOptionsOnly: undefined
       │                           │                              │
       ▼                           ▼                              ▼
[SYNC ALL] true        [API] Sending body:              [BULK-ALL] undefined
                       {"hasOptionsOnly":true}
```

### 2. Arquivos Verificados

| Arquivo | Status | Observações |
|---------|--------|-------------|
| `frontend/src/app/(dashboard)/assets/page.tsx` | ✅ Correto | useState + useCallback com dependências corretas |
| `frontend/src/lib/api.ts` | ✅ Correto | Envia `hasOptionsOnly: hasOptionsOnly ?? false` |
| `backend/src/api/assets/dto/update-asset.dto.ts` | ✅ Correto | DTO com @IsOptional, @IsBoolean, @Transform |
| `backend/src/api/assets/assets-update.controller.ts` | ✅ Correto | Logs adicionados para debug |
| `backend/src/api/assets/assets-update.service.ts` | ✅ Correto | getAssetsWithPriority funciona |

### 3. Evidências dos Logs

**Request não-autorizado (GlobalExceptionFilter):**
```json
{
  "body": {"hasOptionsOnly": true},
  "statusCode": 401
}
```
**Prova:** Frontend ENVIA o valor correto!

**Request autorizado (Controller):**
```
[BULK-ALL] Received request - hasOptionsOnly: undefined, userId: undefined
[BULK-ALL] Using filterValue: false
[GET-PRIORITY] Fetching assets with priority ordering (hasOptionsOnly=false)
[GET-PRIORITY] Returned 861 assets ordered by priority
```
**Prova:** Backend RECEBE undefined!

### 4. Root Cause Identificado

O problema está no **cache de compilação do Docker**:

1. O código TypeScript local está correto (montado como volume `./backend:/app`)
2. O entrypoint do Docker verifica se `/app/dist` existe
3. Se existe, **não reconstrói** - usa código compilado antigo
4. O `nest start --watch` pode não detectar todas as mudanças

**Código do entrypoint (docker-entrypoint.sh):**
```bash
if [ ! -d "dist" ] || [ -z "$(ls -A dist 2>/dev/null)" ]; then
    npm run build  # Só reconstrói se dist não existe!
else
    echo "✅ Dist folder already exists (build will run in watch mode)"
fi
```

## Ações Realizadas

### 1. Adição de Logs para Debug
- `frontend/src/lib/api.ts`: Console.logs para ver valores enviados
- `backend/src/api/assets/assets-update.controller.ts`: Já tinha logs

### 2. Adição do @Transform Decorator
```typescript
// backend/src/api/assets/dto/update-asset.dto.ts
@Transform(({ value }) => {
  if (value === 'true' || value === true || value === 1) return true;
  if (value === 'false' || value === false || value === 0) return false;
  return value;
})
@IsBoolean()
hasOptionsOnly?: boolean;
```

### 3. Limpeza do Cache e Rebuild
```bash
docker exec invest_backend rm -rf /app/dist
docker-compose restart backend
```

## Código Atualizado (Não Commitado)

### frontend/src/lib/api.ts (linha 174-183)
```typescript
async bulkUpdateAllAssetsFundamentals(userId?: string, hasOptionsOnly?: boolean) {
  const body = {
    userId,
    hasOptionsOnly: hasOptionsOnly ?? false,
  };
  console.log('[API] bulkUpdateAllAssetsFundamentals called with:', { userId, hasOptionsOnly });
  console.log('[API] Sending body:', JSON.stringify(body));
  const response = await this.client.post('/assets/updates/bulk-all', body);
  return response.data;
}
```

### backend/src/api/assets/dto/update-asset.dto.ts (linha 125-138)
```typescript
@ApiPropertyOptional({
  description: 'Filter to only update assets that have options (hasOptions=true)',
  example: true,
  default: false,
})
@IsOptional()
@Transform(({ value }) => {
  if (value === 'true' || value === true || value === 1) return true;
  if (value === 'false' || value === false || value === 0) return false;
  return value;
})
@IsBoolean()
hasOptionsOnly?: boolean;
```

## Próximos Passos

1. [ ] Aguardar rebuild completo do backend
2. [ ] Testar novamente com checkbox "Com Opções" marcado
3. [ ] Verificar se apenas ~153 ativos são enfileirados
4. [ ] Commitar as mudanças se o fix funcionar
5. [ ] Atualizar ROADMAP.md

## Prevenção Futura

### Recomendação: Modificar docker-entrypoint.sh
Adicionar lógica para comparar timestamps dos arquivos fonte com o dist:

```bash
# Verificar se algum arquivo .ts é mais novo que dist
if [ -d "dist" ] && [ -n "$(find src -name '*.ts' -newer dist -print -quit 2>/dev/null)" ]; then
    echo "📦 Source files changed, rebuilding..."
    npm run build
fi
```

## Referências

- **Arquivos Modificados:**
  - [update-asset.dto.ts](backend/src/api/assets/dto/update-asset.dto.ts)
  - [api.ts](frontend/src/lib/api.ts)

- **Logs Relevantes:**
  - `[BULK-ALL]` - Controller recebendo request
  - `[GET-PRIORITY]` - Service buscando ativos

---

**Investigado por:** Claude Code (Opus 4.5)
**Metodologia:** Root Cause Analysis + Ultra-Thinking
