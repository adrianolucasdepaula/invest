# Esclarecimento: "Ganho do Dia" no Portfólio

**Data:** 2025-11-12
**Versão:** 1.0
**Status:** ✅ Comportamento Correto (Melhoria UX Sugerida)

---

## 📋 DESCRIÇÃO

Quando um usuário adiciona um ativo ao portfólio, o card "Ganho do Dia" mostra um valor mesmo que o ativo tenha sido adicionado há pouco tempo.

## 🔍 ANÁLISE TÉCNICA

### Comportamento Atual

O sistema calcula DOIS tipos de ganho/lucro:

1. **Ganho Total**
   - Fórmula: `(Preço Atual - Preço Médio de Compra) * Quantidade`
   - Exemplo: (R$ 33,10 - R$ 30,00) * 100 = R$ 310,00
   - Percentual: R$ 310,00 / R$ 3.000,00 = +10.33%
   - **Significado**: Lucro/prejuízo desde que você comprou o ativo

2. **Ganho do Dia**
   - Fórmula: `Variação do Dia no Mercado * Quantidade`
   - Exemplo: -R$ 0,10 * 100 = -R$ 10,00
   - Percentual: -R$ 10,00 / R$ 3.310,00 = -0.30%
   - **Significado**: Quanto seu portfólio ganhou/perdeu HOJE baseado nas oscilações de mercado

### Código Responsável

**Arquivo:** `frontend/src/app/(dashboard)/portfolio/page.tsx`

```typescript
// Linhas 91-97
const dayGain = enrichedPositions.reduce((sum: number, p: any) => {
  const asset = assetMap.get(p.assetId);
  const dayChange = asset?.change || 0;  // Variação do DIA do mercado
  return sum + (dayChange * p.quantity);
}, 0);
const dayGainPercent = totalValue > 0 ? (dayGain / totalValue) * 100 : 0;
```

**Onde vem `asset.change`:**
- Backend: `backend/src/database/entities/asset-price.entity.ts` (linha 51-52)
- Campo: `change` - decimal(18,2) - Variação absoluta do preço no dia
- Origem: Dados da BRAPI ou scrapers que coletam variação diária do mercado

## ✅ CONCLUSÃO

**Este é o comportamento CORRETO** para um sistema de portfólio financeiro!

Sistemas profissionais como:
- Warren Buffett's Portfolio
- Bloomberg Terminal
- Kinvo
- MyProfit
- Clear Corretora

Todos mostram "Ganho do Dia" baseado nas variações de mercado do dia atual, não baseado em quando você adicionou a posição.

**Razão:**
O "Ganho do Dia" serve para responder: "Quanto meu patrimônio variou HOJE?"

---

## 💡 SUGESTÃO DE MELHORIA (UX)

Para evitar confusão do usuário, sugerimos uma das seguintes melhorias:

### Opção 1: Adicionar Tooltip Explicativo

```tsx
<StatCard
  title="Ganho do Dia"
  value={stats.dayGain}
  change={stats.dayGainPercent || undefined}
  format="currency"
  icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
  tooltip="Variação do seu portfólio baseada nas oscilações de mercado de hoje"
/>
```

### Opção 2: Renomear para "Variação do Dia"

```tsx
<StatCard
  title="Variação do Dia"  // Mais claro que "Ganho do Dia"
  ...
/>
```

### Opção 3: Adicionar Badge "Desde dd/mm/yyyy"

Mostrar no card "Ganho Total" desde quando está calculando:

```tsx
<StatCard
  title="Ganho Total"
  subtitle="Desde 12/11/2025"  // Data da primeira compra
  ...
/>
```

---

## 📊 EXEMPLO PRÁTICO

**Cenário:**
- Você comprou 100 ações PETR4 a R$ 30,00 em 10/11/2025
- Hoje é 12/11/2025
- Preço atual: R$ 33,10
- Variação do mercado hoje: -0.30% (ou -R$ 0,10 por ação)

**Resultado Esperado:**
- **Ganho Total**: +R$ 310,00 (+10.33%) ✅ Desde 10/11
- **Ganho do Dia**: -R$ 10,00 (-0.30%) ✅ Variação de hoje no mercado

**Por que o Ganho do Dia é negativo se tenho lucro total?**
Porque hoje o mercado caiu R$ 0,10 por ação, mesmo que no total você ainda esteja no lucro.

---

## 🎯 AÇÃO RECOMENDADA

**Prioridade:** 🟡 Média (Melhoria de UX, não bug)

**Implementação Sugerida:**
1. Adicionar tooltip no StatCard "Ganho do Dia"
2. Considerar renomear para "Variação do Dia" ou "Resultado do Dia"
3. Adicionar ícone de info (ℹ️) com explicação

**Fase:** FASE 25+ (Melhorias de UX pós-validação)

---

## 📚 REFERÊNCIAS

- Bloomberg Terminal: https://www.bloomberg.com/professional/solution/bloomberg-terminal/
- Kinvo: https://kinvo.com.br
- Clear Corretora: https://www.clear.com.br
- Warren: https://warren.com.br

---

**Fim do Documento**
