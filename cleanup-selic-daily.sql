-- Cleanup old SELIC daily records (keep only monthly from Série 4390)
-- Delete SELIC records with value < 0.10% (daily rates from old Série 11)
DELETE FROM economic_indicators
WHERE indicator_type = 'SELIC'
  AND value < 0.10;

-- Delete CDI records with negative values (calculated from wrong SELIC daily)
DELETE FROM economic_indicators
WHERE indicator_type = 'CDI'
  AND value < 0;

-- Verify remaining records
SELECT indicator_type, COUNT(*) as count, MIN(value) as min_value, MAX(value) as max_value
FROM economic_indicators
WHERE indicator_type IN ('SELIC', 'CDI')
GROUP BY indicator_type;
