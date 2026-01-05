---
name: mcp-triplo
description: Executes MCP Triplo validation (Playwright + Chrome DevTools + Accessibility) for frontend pages
---

# MCP Triplo Validation Skill

Execute comprehensive frontend validation using three MCPs:

## 1. Playwright MCP

Navigate and capture page state:

```javascript
mcp__playwright__browser_navigate({ url: "TARGET_URL" })
mcp__playwright__browser_snapshot({})
mcp__playwright__browser_take_screenshot({ fullPage: true })
```

## 2. Chrome DevTools MCP

Check for errors and network issues:

```javascript
mcp__chrome-devtools__take_snapshot({})
mcp__chrome-devtools__list_console_messages({ types: ["error", "warn"] })
mcp__chrome-devtools__list_network_requests({})
```

## 3. Accessibility MCP

Run WCAG audit:

```javascript
mcp__a11y__audit_webpage({ url: "TARGET_URL" })
mcp__a11y__get_summary({ url: "TARGET_URL" })
```

## Validation Report Template

| MCP | Status | Details |
|-----|--------|---------|
| Playwright | ✅/❌ | Page loaded, X elements found |
| Chrome DevTools | ✅/❌ | X console errors, Y network errors |
| Accessibility | ✅/❌ | X violations, Y warnings |

## Success Criteria

- Page loads without JavaScript errors
- Console: 0 errors
- Network: No 4xx/5xx errors
- Accessibility: No critical violations

If issues found, provide detailed report with fix recommendations.
