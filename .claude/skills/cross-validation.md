---
name: cross-validation
description: Validates financial data against multiple sources for accuracy
---

# Cross-Validation Skill for Financial Data

Validate financial data by comparing values across multiple sources.

## Minimum Sources Required

Cross-validation requires at least 3 sources agreeing for confidence.

## Available Data Sources

1. **Fundamentus** - Free, HTML scraping
2. **BRAPI** - API with rate limits
3. **StatusInvest** - OAuth required
4. **Investidor10** - OAuth required
5. **Fundamentei** - OAuth required
6. **Investsite** - OAuth required

## Validation Process

1. **Collect Data:**
   - Fetch ticker data from 3+ sources
   - Extract key metrics (P/L, ROE, DY, etc.)

2. **Compare Values:**
   - Calculate median (not mean - more robust to outliers)
   - Identify outliers (>10% deviation from median)
   - Flag sources with frequent discrepancies

3. **Confidence Score:**
   - 3/3 sources agree: HIGH confidence
   - 2/3 sources agree: MEDIUM confidence
   - <2 sources agree: LOW confidence (flag for review)

## Output Format

| Metric | Source 1 | Source 2 | Source 3 | Median | Confidence |
|--------|----------|----------|----------|--------|------------|
| P/L | 12.5 | 12.3 | 12.4 | 12.4 | HIGH |
| ROE | 15.2% | 15.0% | 18.5% | 15.1% | MEDIUM |

## Rules

- Never use Float for financial values (use Decimal)
- Always use timezone America/Sao_Paulo
- Never round/manipulate values for "aesthetics"
- Document discrepancies in KNOWN-ISSUES.md
