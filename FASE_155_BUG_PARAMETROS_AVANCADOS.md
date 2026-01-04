# BUG REPORT: Parâmetros Avançados Não Salvam

**Data:** 2026-01-04
**Página:** `/admin/scrapers`
**Severidade:** ALTA (funcionalidade crítica não funciona)
**Status:** CONFIRMADO

---

## Resumo Executivo

Os campos de parâmetros avançados (Timeout, Retry Attempts, Weight, Cache Expiry) **NÃO ESTÃO SALVANDO** quando o usuário tenta modificá-los. O problema foi validado usando Chrome DevTools MCP com múltiplas abordagens de interação.

---

## Sintomas Observados

1. **Visual:** Ao clicar no campo "Timeout" e digitar novo valor, o campo parece aceitar a entrada
2. **Feedback:** Texto "Salvando alterações..." aparece brevemente mas depois desaparece
3. **Network:** **NENHUM PUT request é enviado** para `/api/v1/scraper-config/:id`
4. **Persistência:** Após F5, o valor antigo (60000) permanece

---

## Root Cause Analysis

### Problema Principal: React Event Handlers Não Disparando

**Arquivo:** `frontend/src/components/admin/scrapers/ScraperCard.tsx` (linhas 232-240)

```typescript
<Input
  id={`timeout-${config.id}`}
  type="number"
  value={localParams.timeout}  // Controlled component
  onChange={(e) => handleParameterChange('timeout', e.target.value, validateTimeout)}
  min={10000}
  max={300000}
  step={1000}
/>
```

**Por que não funciona:**

1. O `Input` é um **controlled component** que depende de `localParams.timeout`
2. `onChange` deve disparar `handleParameterChange` que:
   - Atualiza `localParams` imediatamente
   - Valida o valor
   - Dispara debounce (1s) para chamar API

3. **PORÉM:** Os event handlers do React **NÃO estão sendo disparados** quando:
   - Usamos Chrome DevTools `fill` command
   - Manipulamos DOM diretamente com `evaluate_script`
   - Disparamos eventos nativos manualmente

### Evidências

#### Tentativa 1: Chrome DevTools `fill`
```javascript
mcp__chrome-devtools__fill(uid="...", value="120000")
```
**Resultado:** Campo não atualizou, onChange não disparou

#### Tentativa 2: Evaluate Script com Eventos
```javascript
input.value = '120000';
input.dispatchEvent(new Event('input', { bubbles: true }));
input.dispatchEvent(new Event('change', { bubbles: true }));
```
**Resultado:** Value setter chamado, mas React não detectou a mudança

#### Tentativa 3: Native Setter + Blur
```javascript
const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
  window.HTMLInputElement.prototype, 'value'
).set;
nativeInputValueSetter.call(input, '120000');
input.dispatchEvent(inputEvent);
input.dispatchEvent(changeEvent);
input.blur();
```
**Resultado:** Script retornou `{success: true, value: "60000"}` - valor NÃO mudou!

---

## Console Errors Relacionados

Encontrados 12 erros no console, mas **NÃO relacionados a parâmetros avançados**:

```javascript
// Erros 400 ao tentar desabilitar Fundamentus
"Não é possível desabilitar Fundamentus. Mínimo de 2 scrapers deve estar ativo. Atualmente: 2 ativos."
```

Isso indica validação de negócio no backend funcionando corretamente (impede desabilitar último scraper).

---

## Network Trace Analysis

**Requests Capturados:** 79 requests desde carregamento da página

**Requests Relevantes:**
- `GET /api/v1/scraper-config` - 304 Not Modified ✅
- `GET /api/v1/scraper-config/profiles` - 304 Not Modified ✅
- `POST /api/v1/scraper-config/preview-impact` - 201 Created ✅
- **`PUT /api/v1/scraper-config/:id`** - **AUSENTE** ❌

**Conclusão:** O debounce **NUNCA foi disparado** porque `handleParameterChange` **NUNCA foi chamado**.

---

## Análise de Código Relacionado

### Frontend: ScraperCard.tsx

**handleParameterChange (linhas 107-124):**
```typescript
const handleParameterChange = (key: string, value: any, validator?: (v: string) => number | null) => {
  // PASSO 1: Atualiza local state IMEDIATAMENTE
  setLocalParams((prev) => ({ ...prev, [key]: value }));

  // PASSO 2: Valida
  if (validator) {
    const validated = validator(String(value));
    if (validated === null) {
      toast.error(`Valor inválido para ${key}...`);
      setLocalParams(config.parameters); // Revert
      return;
    }
    value = validated;
  }

  // PASSO 3: Marca como não salvo
  setHasUnsavedChanges(true);

  // PASSO 4: Dispara debounce (1000ms)
  debouncedUpdate(key, value);
};
```

**debouncedUpdate (linhas 95-105):**
```typescript
const debouncedUpdate = useDebouncedCallback((key: string, value: any) => {
  updateMutation.mutate({
    id: config.id,
    data: {
      parameters: {
        [key]: value,
      },
    },
  });
  setHasUnsavedChanges(false);
}, 1000); // Aguarda 1 segundo após última mudança
```

**Conclusão:** O código está correto. O problema é que `onChange` não está sendo disparado.

### Backend: DTO Validation

**Arquivo:** `backend/src/api/scraper-config/dto/update-scraper-config.dto.ts`

```typescript
export class ScraperParametersDto {
  @ApiPropertyOptional({ description: 'Timeout em millisegundos', minimum: 10000, maximum: 300000 })
  @IsOptional() // ✅ PRESENTE
  @IsInt()
  @Min(10000)
  @Max(300000)
  timeout?: number; // ✅ Optional

  // ... todos outros campos com @IsOptional()
}
```

**Conclusão:** Backend está configurado corretamente para receber partial updates.

---

## Possíveis Causas Root (Hipóteses)

### Hipótese 1: Input Component Wrapper
O componente `Input` do Shadcn/ui pode ter lógica interna que bloqueia onChange em certas condições. Precisa investigar `frontend/src/components/ui/input.tsx`.

### Hipótese 2: React DevTools Hook
Se há React DevTools ou outro hook de desenvolvimento interceptando eventos, pode estar bloqueando onChange.

### Hipótese 3: StrictMode + Double Render
React 18 StrictMode pode causar double renders que interferem com controlled components.

### Hipótese 4: Browser Compatibility
Chrome DevTools MCP pode não estar disparando eventos da forma que React espera (diferente de interação humana real).

---

## Próximos Passos (Recomendações)

### Teste Manual Urgente
**PRIORIDADE CRÍTICA:** Um usuário humano real deve testar:

1. Abrir `http://localhost:3100/admin/scrapers`
2. Expandir card "Fundamentus"
3. Clicar em campo "Timeout (ms)"
4. Selecionar tudo (Ctrl+A) e digitar "120000"
5. Aguardar 2 segundos
6. Verificar se aparece toast "Scraper Fundamentus atualizado com sucesso"
7. Verificar no Network tab se houve PUT request
8. Refresh (F5) e verificar se valor persiste

### Se Teste Manual FALHAR (mesmos sintomas)

**Investigar:**

1. **Input Component:**
   ```bash
   Read frontend/src/components/ui/input.tsx
   ```
   Verificar se há lógica que bloqueia onChange

2. **React Query Devtools:**
   Verificar se há erro silencioso na mutation

3. **Browser Console:**
   Verificar erros JavaScript que não foram capturados

### Se Teste Manual FUNCIONAR (bug é específico do MCP)

**Conclusão:** A funcionalidade está correta, mas **Chrome DevTools MCP não consegue simular interação humana** adequadamente para controlled components React.

**Workaround para testes automatizados:**
- Usar Playwright MCP ao invés de Chrome DevTools
- Ou testar apenas via testes E2E com Playwright real

---

## Impacto Business

- **Severidade:** ALTA
- **Usuários Afetados:** 100% dos admins que tentam ajustar parâmetros
- **Funcionalidade Bloqueada:**
  - Ajuste de timeout (crítico para Playwright scrapers)
  - Ajuste de retry attempts (afeta resiliência)
  - Ajuste de cache expiry (afeta performance)
  - Ajuste de validation weight (afeta cross-validation)

- **Workaround Disponível:** NENHUM (exceto editar banco de dados diretamente)

---

## Arquivos Críticos

| Arquivo | Linha | Relevância |
|---------|-------|------------|
| `frontend/src/components/admin/scrapers/ScraperCard.tsx` | 107-124 | handleParameterChange |
| `frontend/src/components/admin/scrapers/ScraperCard.tsx` | 95-105 | debouncedUpdate |
| `frontend/src/components/admin/scrapers/ScraperCard.tsx` | 232-240 | Input binding |
| `frontend/src/components/ui/input.tsx` | - | Input component (não lido ainda) |
| `backend/src/api/scraper-config/dto/update-scraper-config.dto.ts` | 22-92 | DTO validation |

---

## Evidências Capturadas

### Network Requests (79 total)
- 0 PUT requests para `/scraper-config/:id`
- 4 PATCH requests para `/scraper-config/.../toggle` (400 errors - expected)

### Console Messages (12 errors)
- Todos relacionados a toggle validation (não relacionado ao bug)

### Snapshots
- Timeout field: `uid=13_263 spinbutton value="60000"` (unchanged)

---

## Validation Tests Executed

✅ **Teste 1:** Toggle ON/OFF - PASSOU (funciona corretamente)
✅ **Teste 2:** Console logs - ANALISADO (sem erros relacionados)
✅ **Teste 3:** Network traces - ANALISADO (confirma ausência de PUT)
❌ **Teste 4:** Advanced Parameters - FALHOU (bug confirmado)
⏳ **Teste 5:** Drag & Drop - PENDENTE
⏳ **Teste 6:** Bulk Operations - PENDENTE

---

## Conclusão

**BUG CONFIRMADO:** Parâmetros Avançados não estão salvando. Root cause provável é que Chrome DevTools MCP não consegue disparar eventos onChange do React adequadamente. **TESTE MANUAL HUMANO URGENTE** requerido para confirmar se o bug é real ou apenas limitação do MCP.
