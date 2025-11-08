-- Script para popular o banco com dados de teste realistas
-- Executar: psql -U invest_user -h localhost -d invest_db -f seed_test_data.sql

-- Limpar dados existentes (opcional)
-- TRUNCATE assets, asset_prices, fundamental_data CASCADE;

-- Inserir ativos
INSERT INTO assets (ticker, name, type, sector, subsector, is_active, created_at, updated_at)
VALUES
    ('VALE3', 'VALE ON NM', 'stock', 'Mineração', 'Minerais Metálicos', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('PETR4', 'PETROBRAS PN', 'stock', 'Petróleo e Gás', 'Exploração e Refino', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('ITUB4', 'ITAÚ UNIBANCO PN', 'stock', 'Financeiro', 'Bancos', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('BBDC4', 'BRADESCO PN', 'stock', 'Financeiro', 'Bancos', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('WEGE3', 'WEG ON NM', 'stock', 'Bens Industriais', 'Máquinas e Equipamentos', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('MGLU3', 'MAGAZINE LUIZA ON NM', 'stock', 'Consumo Cíclico', 'Comércio', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('RENT3', 'LOCALIZA ON NM', 'stock', 'Consumo Cíclico', 'Aluguel de Carros', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('SUZB3', 'SUZANO ON NM', 'stock', 'Materiais Básicos', 'Papel e Celulose', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (ticker) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

-- Inserir preços atuais
INSERT INTO asset_prices (asset_id, date, open, high, low, close, volume, created_at, updated_at)
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
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM assets a
WHERE a.ticker IN ('VALE3', 'PETR4', 'ITUB4', 'BBDC4', 'WEGE3', 'MGLU3', 'RENT3', 'SUZB3')
ON CONFLICT (asset_id, date) DO UPDATE
SET close = EXCLUDED.close, volume = EXCLUDED.volume, updated_at = CURRENT_TIMESTAMP;

-- Inserir dados fundamentalistas
INSERT INTO fundamental_data (
    asset_id, reference_date,
    pl, pvp, psr, p_ebit, p_ativo,
    dividend_yield, roe, roic,
    liq_corrente, divida_bruta_patrimonio, crescimento_receita_5anos,
    created_at, updated_at
)
SELECT
    a.id,
    CURRENT_DATE,
    CASE a.ticker
        WHEN 'VALE3' THEN 5.2
        WHEN 'PETR4' THEN 4.8
        WHEN 'ITUB4' THEN 7.3
        WHEN 'BBDC4' THEN 6.9
        WHEN 'WEGE3' THEN 35.4
        WHEN 'MGLU3' THEN NULL
        WHEN 'RENT3' THEN 18.7
        WHEN 'SUZB3' THEN 11.2
    END as pl,
    CASE a.ticker
        WHEN 'VALE3' THEN 1.8
        WHEN 'PETR4' THEN 1.2
        WHEN 'ITUB4' THEN 1.9
        WHEN 'BBDC4' THEN 1.7
        WHEN 'WEGE3' THEN 12.3
        WHEN 'MGLU3' THEN 2.1
        WHEN 'RENT3' THEN 5.6
        WHEN 'SUZB3' THEN 2.4
    END as pvp,
    CASE a.ticker
        WHEN 'VALE3' THEN 2.1
        WHEN 'PETR4' THEN 0.9
        WHEN 'ITUB4' THEN NULL
        WHEN 'BBDC4' THEN NULL
        WHEN 'WEGE3' THEN 7.8
        WHEN 'MGLU3' THEN 0.3
        WHEN 'RENT3' THEN 3.4
        WHEN 'SUZB3' THEN 1.9
    END as psr,
    CASE a.ticker
        WHEN 'VALE3' THEN 3.8
        WHEN 'PETR4' THEN 2.9
        WHEN 'ITUB4' THEN NULL
        WHEN 'BBDC4' THEN NULL
        WHEN 'WEGE3' THEN 28.5
        WHEN 'MGLU3' THEN 45.2
        WHEN 'RENT3' THEN 12.8
        WHEN 'SUZB3' THEN 7.6
    END as p_ebit,
    CASE a.ticker
        WHEN 'VALE3' THEN 0.9
        WHEN 'PETR4' THEN 0.7
        WHEN 'ITUB4' THEN NULL
        WHEN 'BBDC4' THEN NULL
        WHEN 'WEGE3' THEN 5.4
        WHEN 'MGLU3' THEN 1.2
        WHEN 'RENT3' THEN 3.2
        WHEN 'SUZB3' THEN 1.5
    END as p_ativo,
    CASE a.ticker
        WHEN 'VALE3' THEN 8.5
        WHEN 'PETR4' THEN 12.3
        WHEN 'ITUB4' THEN 5.2
        WHEN 'BBDC4' THEN 5.8
        WHEN 'WEGE3' THEN 1.2
        WHEN 'MGLU3' THEN 0.0
        WHEN 'RENT3' THEN 2.1
        WHEN 'SUZB3' THEN 3.4
    END as dividend_yield,
    CASE a.ticker
        WHEN 'VALE3' THEN 34.5
        WHEN 'PETR4' THEN 25.8
        WHEN 'ITUB4' THEN 26.3
        WHEN 'BBDC4' THEN 24.7
        WHEN 'WEGE3' THEN 34.8
        WHEN 'MGLU3' THEN -5.2
        WHEN 'RENT3' THEN 29.8
        WHEN 'SUZB3' THEN 21.5
    END as roe,
    CASE a.ticker
        WHEN 'VALE3' THEN 28.9
        WHEN 'PETR4' THEN 19.7
        WHEN 'ITUB4' THEN NULL
        WHEN 'BBDC4' THEN NULL
        WHEN 'WEGE3' THEN 26.5
        WHEN 'MGLU3' THEN -3.8
        WHEN 'RENT3' THEN 18.4
        WHEN 'SUZB3' THEN 15.2
    END as roic,
    CASE a.ticker
        WHEN 'VALE3' THEN 2.1
        WHEN 'PETR4' THEN 1.8
        WHEN 'ITUB4' THEN NULL
        WHEN 'BBDC4' THEN NULL
        WHEN 'WEGE3' THEN 2.9
        WHEN 'MGLU3' THEN 1.2
        WHEN 'RENT3' THEN 1.5
        WHEN 'SUZB3' THEN 1.9
    END as liq_corrente,
    CASE a.ticker
        WHEN 'VALE3' THEN 0.25
        WHEN 'PETR4' THEN 0.35
        WHEN 'ITUB4' THEN NULL
        WHEN 'BBDC4' THEN NULL
        WHEN 'WEGE3' THEN 0.15
        WHEN 'MGLU3' THEN 0.85
        WHEN 'RENT3' THEN 0.65
        WHEN 'SUZB3' THEN 0.45
    END as divida_bruta_patrimonio,
    CASE a.ticker
        WHEN 'VALE3' THEN 8.5
        WHEN 'PETR4' THEN 5.2
        WHEN 'ITUB4' THEN 7.8
        WHEN 'BBDC4' THEN 6.9
        WHEN 'WEGE3' THEN 15.3
        WHEN 'MGLU3' THEN 22.4
        WHEN 'RENT3' THEN 18.7
        WHEN 'SUZB3' THEN 12.1
    END as crescimento_receita_5anos,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM assets a
WHERE a.ticker IN ('VALE3', 'PETR4', 'ITUB4', 'BBDC4', 'WEGE3', 'MGLU3', 'RENT3', 'SUZB3')
ON CONFLICT (asset_id, reference_date) DO UPDATE
SET pl = EXCLUDED.pl,
    pvp = EXCLUDED.pvp,
    dividend_yield = EXCLUDED.dividend_yield,
    updated_at = CURRENT_TIMESTAMP;

-- Verificar dados inseridos
SELECT
    a.ticker,
    a.name,
    a.sector,
    ap.close as price,
    fd.pl,
    fd.pvp,
    fd.dividend_yield as dy
FROM assets a
LEFT JOIN asset_prices ap ON a.id = ap.asset_id AND ap.date = CURRENT_DATE
LEFT JOIN fundamental_data fd ON a.id = fd.asset_id AND fd.reference_date = CURRENT_DATE
WHERE a.ticker IN ('VALE3', 'PETR4', 'ITUB4', 'BBDC4', 'WEGE3', 'MGLU3', 'RENT3', 'SUZB3')
ORDER BY a.ticker;
