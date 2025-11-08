-- Popular banco com dados de teste

-- Inserir preços atuais
INSERT INTO asset_prices (asset_id, date, open, high, low, close, volume, created_at)
SELECT
    a.id,
    CURRENT_DATE,
    CASE a.ticker
        WHEN 'VALE3' THEN 61.50
        WHEN 'PETR4' THEN 38.45
        WHEN 'ITUB4' THEN 25.80
        WHEN 'BBDC4' THEN 13.25
        WHEN 'WEGE3' THEN 42.30
        WHEN 'MGLU3' THEN 12.45
        WHEN 'RENT3' THEN 55.20
        WHEN 'SUZB3' THEN 52.80
    END as open,
    CASE a.ticker
        WHEN 'VALE3' THEN 62.10
        WHEN 'PETR4' THEN 38.90
        WHEN 'ITUB4' THEN 26.15
        WHEN 'BBDC4' THEN 13.55
        WHEN 'WEGE3' THEN 42.85
        WHEN 'MGLU3' THEN 12.80
        WHEN 'RENT3' THEN 55.90
        WHEN 'SUZB3' THEN 53.45
    END as high,
    CASE a.ticker
        WHEN 'VALE3' THEN 61.20
        WHEN 'PETR4' THEN 38.30
        WHEN 'ITUB4' THEN 25.70
        WHEN 'BBDC4' THEN 13.15
        WHEN 'WEGE3' THEN 42.10
        WHEN 'MGLU3' THEN 12.35
        WHEN 'RENT3' THEN 55.00
        WHEN 'SUZB3' THEN 52.60
    END as low,
    CASE a.ticker
        WHEN 'VALE3' THEN 61.85
        WHEN 'PETR4' THEN 38.75
        WHEN 'ITUB4' THEN 26.05
        WHEN 'BBDC4' THEN 13.45
        WHEN 'WEGE3' THEN 42.60
        WHEN 'MGLU3' THEN 12.65
        WHEN 'RENT3' THEN 55.70
        WHEN 'SUZB3' THEN 53.20
    END as close,
    CASE a.ticker
        WHEN 'VALE3' THEN 45680000
        WHEN 'PETR4' THEN 38920000
        WHEN 'ITUB4' THEN 29340000
        WHEN 'BBDC4' THEN 21560000
        WHEN 'WEGE3' THEN 15780000
        WHEN 'MGLU3' THEN 18450000
        WHEN 'RENT3' THEN 12340000
        WHEN 'SUZB3' THEN 9870000
    END as volume,
    CURRENT_TIMESTAMP
FROM assets a
WHERE a.ticker IN ('VALE3', 'PETR4', 'ITUB4', 'BBDC4', 'WEGE3', 'MGLU3', 'RENT3', 'SUZB3')
ON CONFLICT (asset_id, date) DO UPDATE
SET close = EXCLUDED.close, volume = EXCLUDED.volume;

-- Inserir dados fundamentalistas  
INSERT INTO fundamental_data (
    asset_id, reference_date,
    pl, pvp, psr, p_ebit, p_ativos,
    dividend_yield, roe, roic,
    cagr_receitas_5anos,
    created_at, updated_at
)
SELECT
    a.id,
    CURRENT_DATE,
    CASE a.ticker
        WHEN 'VALE3' THEN 5.2 WHEN 'PETR4' THEN 4.8
        WHEN 'ITUB4' THEN 7.3 WHEN 'BBDC4' THEN 6.9
        WHEN 'WEGE3' THEN 35.4 WHEN 'MGLU3' THEN NULL
        WHEN 'RENT3' THEN 18.7 WHEN 'SUZB3' THEN 11.2
    END,
    CASE a.ticker
        WHEN 'VALE3' THEN 1.8 WHEN 'PETR4' THEN 1.2
        WHEN 'ITUB4' THEN 1.9 WHEN 'BBDC4' THEN 1.7
        WHEN 'WEGE3' THEN 12.3 WHEN 'MGLU3' THEN 2.1
        WHEN 'RENT3' THEN 5.6 WHEN 'SUZB3' THEN 2.4
    END,
    CASE a.ticker
        WHEN 'VALE3' THEN 2.1 WHEN 'PETR4' THEN 0.9
        WHEN 'ITUB4' THEN NULL WHEN 'BBDC4' THEN NULL
        WHEN 'WEGE3' THEN 7.8 WHEN 'MGLU3' THEN 0.3
        WHEN 'RENT3' THEN 3.4 WHEN 'SUZB3' THEN 1.9
    END,
    CASE a.ticker
        WHEN 'VALE3' THEN 3.8 WHEN 'PETR4' THEN 2.9
        WHEN 'ITUB4' THEN NULL WHEN 'BBDC4' THEN NULL
        WHEN 'WEGE3' THEN 28.5 WHEN 'MGLU3' THEN 45.2
        WHEN 'RENT3' THEN 12.8 WHEN 'SUZB3' THEN 7.6
    END,
    CASE a.ticker
        WHEN 'VALE3' THEN 0.9 WHEN 'PETR4' THEN 0.7
        WHEN 'ITUB4' THEN NULL WHEN 'BBDC4' THEN NULL
        WHEN 'WEGE3' THEN 5.4 WHEN 'MGLU3' THEN 1.2
        WHEN 'RENT3' THEN 3.2 WHEN 'SUZB3' THEN 1.5
    END,
    CASE a.ticker
        WHEN 'VALE3' THEN 8.5 WHEN 'PETR4' THEN 12.3
        WHEN 'ITUB4' THEN 5.2 WHEN 'BBDC4' THEN 5.8
        WHEN 'WEGE3' THEN 1.2 WHEN 'MGLU3' THEN 0.0
        WHEN 'RENT3' THEN 2.1 WHEN 'SUZB3' THEN 3.4
    END,
    CASE a.ticker
        WHEN 'VALE3' THEN 34.5 WHEN 'PETR4' THEN 25.8
        WHEN 'ITUB4' THEN 26.3 WHEN 'BBDC4' THEN 24.7
        WHEN 'WEGE3' THEN 34.8 WHEN 'MGLU3' THEN -5.2
        WHEN 'RENT3' THEN 29.8 WHEN 'SUZB3' THEN 21.5
    END,
    CASE a.ticker
        WHEN 'VALE3' THEN 28.9 WHEN 'PETR4' THEN 19.7
        WHEN 'ITUB4' THEN NULL WHEN 'BBDC4' THEN NULL
        WHEN 'WEGE3' THEN 26.5 WHEN 'MGLU3' THEN -3.8
        WHEN 'RENT3' THEN 18.4 WHEN 'SUZB3' THEN 15.2
    END,
    CASE a.ticker
        WHEN 'VALE3' THEN 8.5 WHEN 'PETR4' THEN 5.2
        WHEN 'ITUB4' THEN 7.8 WHEN 'BBDC4' THEN 6.9
        WHEN 'WEGE3' THEN 15.3 WHEN 'MGLU3' THEN 22.4
        WHEN 'RENT3' THEN 18.7 WHEN 'SUZB3' THEN 12.1
    END,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM assets a
WHERE a.ticker IN ('VALE3', 'PETR4', 'ITUB4', 'BBDC4', 'WEGE3', 'MGLU3', 'RENT3', 'SUZB3')
ON CONFLICT (asset_id, reference_date) DO UPDATE
SET pl = EXCLUDED.pl, pvp = EXCLUDED.pvp, dividend_yield = EXCLUDED.dividend_yield, updated_at = CURRENT_TIMESTAMP;

-- Verificar
SELECT a.ticker, a.name, ap.close, fd.pl, fd.pvp, fd.dividend_yield
FROM assets a
LEFT JOIN asset_prices ap ON a.id = ap.asset_id AND ap.date = CURRENT_DATE
LEFT JOIN fundamental_data fd ON a.id = fd.asset_id AND fd.reference_date = CURRENT_DATE
WHERE a.ticker IN ('VALE3', 'PETR4', 'ITUB4', 'BBDC4', 'WEGE3', 'MGLU3', 'RENT3', 'SUZB3')
ORDER BY a.ticker;
