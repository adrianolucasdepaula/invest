# Convenções para Armazenamento de Screenshots - Validações

**Versão:** 1.0.0
**Data:** 2025-11-16
**Autor:** Claude Code (Sonnet 4.5)

---

## 📁 Estrutura de Diretórios

```
validations/
├── {NOME_VALIDACAO}_YYYY-MM-DD/
│   ├── README.md                          # Relatório completo
│   ├── {numero}_{ferramenta}_{descricao}.png    # Screenshots
│   ├── {numero}_{ferramenta}_{descricao}_snapshot.txt  # DOM snapshots
│   ├── BUG_*.md (opcional)                # Relatórios de bugs
│   └── FIXES_*.md (opcional)              # Documentação de fixes
```

**Exemplo:**
```
validations/
├── FRONTEND_CONSOLIDACAO_2025-11-16/
│   ├── README.md
│   ├── 1_playwright_analysis_tab_por_analise.png
│   ├── 1_chrome_devtools_analysis_por_analise.png
│   ├── 1_chrome_devtools_analysis_por_analise_snapshot.txt
│   ├── 2_playwright_analysis_tab_por_ativo.png
│   ├── BUG_CRITICO_MODO_AVANCADO.md
│   └── ...
```

---

## 🏷️ Nomenclatura de Arquivos

### Screenshots PNG

**Formato:**
```
{numero}_{ferramenta}_{pagina}_{variacao}.png
```

**Componentes:**
- `{numero}` - Sequência numérica (1, 2, 3, ...)
- `{ferramenta}` - Ferramenta utilizada (`playwright`, `chrome_devtools`, `selenium`)
- `{pagina}` - Página validada (ex: `analysis`, `vale3`, `dashboard`)
- `{variacao}` - Variação/estado (ex: `tab_por_ativo`, `modo_basico`, `error_modal`)

**Exemplos Válidos:**
```
1_playwright_analysis_tab_por_analise.png
2_chrome_devtools_vale3_modo_avancado.png
3_playwright_dashboard_loading_state.png
4_chrome_devtools_reports_bulk_analysis.png
```

**Exemplos Inválidos:**
```
❌ screenshot1.png (sem contexto)
❌ VALE3_screenshot.png (sem ferramenta)
❌ 1-playwright-analysis.png (usar underscore)
❌ playwright_1_analysis.png (número deve vir primeiro)
```

---

### DOM Snapshots TXT

**Formato:**
```
{numero}_{ferramenta}_{pagina}_{variacao}_snapshot.txt
```

**Exemplo:**
```
1_chrome_devtools_analysis_por_analise_snapshot.txt
```

**Observação:** Apenas Chrome DevTools gera snapshots por padrão.

---

## 🔧 Ferramentas e Prefixos

| Ferramenta | Prefixo | Tipo de Captura | Notas |
|------------|---------|-----------------|-------|
| Playwright MCP | `playwright` | Viewport ou Full-page | Padrão: full-page |
| Chrome DevTools MCP | `chrome_devtools` | Full-page + DOM snapshot | Sempre full-page |
| Selenium MCP | `selenium` | Configurable | Raramente usado |
| a11y MCP | `a11y` | Apenas relatórios JSON | Sem screenshots |

---

## 📏 Padrões de Qualidade

### Screenshots PNG

**Formato:** PNG (preferencialmente)
**Tipo:** Full-page screenshot (captura página completa com scroll)
**Exceções:** Modais, erros, popups podem usar viewport screenshot

**Boas Práticas:**
- ✅ Capturar página completa sempre que possível
- ✅ Incluir timestamp no nome se múltiplas capturas da mesma página
- ✅ Usar ambas ferramentas (Playwright + Chrome DevTools) para comparação
- ✅ Capturar estados de erro com modal visível

**Evitar:**
- ❌ Screenshots apenas de viewport em páginas longas
- ❌ Screenshots cortados ou incompletos
- ❌ Screenshots com resolução muito baixa
- ❌ Screenshots sem contexto (não identificáveis)

---

### DOM Snapshots TXT

**Formato:** Plain text (YAML-like structure do Chrome DevTools)
**Encoding:** UTF-8

**Conteúdo Esperado:**
- Estrutura completa da DOM acessível (a11y tree)
- Elementos interativos com refs únicos
- Estado atual dos elementos (checked, selected, etc)

---

## 📦 Armazenamento

### Diretório Principal

**Localização:** `validations/{NOME_VALIDACAO}_YYYY-MM-DD/`

**TODOS os arquivos** (screenshots, snapshots, documentação) devem estar neste diretório.

### Diretórios Temporários

**Playwright MCP:**
`.playwright-mcp/validations/{NOME}/` - **NÃO COMMITAR**

**Processo:**
1. Playwright salva em `.playwright-mcp/validations/`
2. Copiar screenshots para `validations/{NOME}/`
3. Commitar apenas `validations/{NOME}/`

**Comando:**
```bash
cp .playwright-mcp/validations/{NOME}/*.png validations/{NOME}/
git add -f validations/{NOME}/*.png
```

---

## 🎯 Convenção de Numeração

**Sequência:** Numérica crescente (1, 2, 3, 4, ...)

**Agrupamento por Página:**
```
1_playwright_analysis_tab_por_analise.png
1_chrome_devtools_analysis_tab_por_analise.png
1_chrome_devtools_analysis_tab_por_analise_snapshot.txt

2_playwright_analysis_tab_por_ativo.png
2_chrome_devtools_analysis_tab_por_ativo.png
2_chrome_devtools_analysis_tab_por_ativo_snapshot.txt

3_playwright_vale3_modo_basico.png
3_chrome_devtools_vale3_modo_basico.png
3_chrome_devtools_vale3_modo_basico_snapshot.txt
```

**Lógica:**
- Mesmo número = mesma página/view
- Ferramentas diferentes = mesmo número, prefixos diferentes
- Variações da mesma página = números sequenciais diferentes

---

## 📊 Tabela de Inventário (README.md)

**Sempre incluir** no `README.md` de cada validação:

```markdown
### Screenshots (X arquivos PNG - Total: X MB)
| Arquivo | Ferramenta | Tamanho | Descrição |
|---------|-----------|---------|-----------|
| `1_playwright_analysis.png` | Playwright | 116 KB | Tab "Por Análise" |
| `1_chrome_devtools_analysis.png` | Chrome DevTools | 244 KB | Tab "Por Análise" |

### Snapshots (X arquivos TXT - Total: X KB)
| Arquivo | Tamanho | Descrição |
|---------|---------|-----------|
| `1_chrome_devtools_analysis_snapshot.txt` | 3.7 KB | DOM Tab "Por Análise" |

**Total:** X arquivos, ~X MB
```

---

## 🔍 Checklist de Validação

Antes de commitar validação, verificar:

- [ ] Todos os screenshots estão em `validations/{NOME}/`
- [ ] Nomenclatura segue convenção `{num}_{tool}_{page}_{var}.png`
- [ ] Screenshots são full-page (exceto modais/erros)
- [ ] DOM snapshots incluídos para Chrome DevTools
- [ ] README.md contém tabela de inventário completa
- [ ] Tamanhos dos arquivos documentados
- [ ] `.playwright-mcp/` NÃO commitado
- [ ] Screenshots adicionados com `git add -f` (se necessário)

---

## 🚀 Exemplo Completo de Fluxo

### 1. Criar Validação

```bash
mkdir -p validations/MINHA_VALIDACAO_2025-11-16
cd validations/MINHA_VALIDACAO_2025-11-16
```

### 2. Capturar Screenshots (Playwright)

```typescript
// Playwright MCP salva automaticamente em .playwright-mcp/
await page.goto('http://localhost:3100/analysis');
await page.screenshot({
  filename: 'validations/MINHA_VALIDACAO_2025-11-16/1_playwright_analysis.png',
  fullPage: true
});
```

### 3. Capturar Screenshots (Chrome DevTools)

```typescript
// Chrome DevTools MCP
await take_screenshot({
  filePath: 'validations/MINHA_VALIDACAO_2025-11-16/1_chrome_devtools_analysis.png',
  fullPage: true
});

await take_snapshot({
  filePath: 'validations/MINHA_VALIDACAO_2025-11-16/1_chrome_devtools_analysis_snapshot.txt'
});
```

### 4. Consolidar Screenshots Playwright

```bash
# Copiar do diretório temporário
cp .playwright-mcp/validations/MINHA_VALIDACAO_2025-11-16/*.png \
   validations/MINHA_VALIDACAO_2025-11-16/

# Verificar
ls -lh validations/MINHA_VALIDACAO_2025-11-16/
```

### 5. Criar README.md

```markdown
# Validação {NOME}

**Data:** 2025-11-16
**Páginas:** X
**MCPs:** Playwright + Chrome DevTools + a11y

## 📸 Evidências

### {Página 1}
1. `1_playwright_{page}.png` (Playwright, XXX KB)
2. `1_chrome_devtools_{page}.png` (Chrome DevTools, XXX KB)
3. `1_chrome_devtools_{page}_snapshot.txt` (DOM, XXX KB)

## 📦 Arquivos Gerados

**Total:** X arquivos, ~X MB
```

### 6. Commitar

```bash
git add validations/MINHA_VALIDACAO_2025-11-16/
git add -f validations/MINHA_VALIDACAO_2025-11-16/*.png  # Se necessário
git commit -m "docs: Validação {NOME}

- X páginas validadas
- Y screenshots capturados
- Z bugs encontrados

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## 📚 Referências

**Validações Anteriores:**
- `validations/FRONTEND_CONSOLIDACAO_2025-11-16/` - Exemplo completo

**MCPs Utilizados:**
- Playwright MCP - Browser automation
- Chrome DevTools MCP - Browser inspection + snapshots
- a11y MCP - Accessibility audits

---

## 🔄 Histórico de Versões

| Versão | Data | Mudanças |
|--------|------|----------|
| 1.0.0 | 2025-11-16 | Versão inicial - padronização completa |

---

**Criado por:** Claude Code (Sonnet 4.5)
**Co-Authored-By:** Claude <noreply@anthropic.com>
