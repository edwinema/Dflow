-- Empty production catalogs need usable roots, without importing demonstration records.
-- Preserve every existing nonempty tree and every other dictionary setting.
UPDATE app_settings
SET value=jsonb_set(jsonb_set(value,
  '{sysDocTree}', CASE WHEN COALESCE(value->'sysDocTree','null'::jsonb) IN ('null'::jsonb,'[]'::jsonb)
    THEN '[{"id":"doc_dir_root","parentId":"","label":"制度文件库","code":"ZD-ROOT"}]'::jsonb
    ELSE value->'sysDocTree' END),
  '{riskTree}', CASE WHEN COALESCE(value->'riskTree','null'::jsonb) IN ('null'::jsonb,'[]'::jsonb)
    THEN '[{"id":"risk_dir_root","parentId":"","label":"风险合规库","code":"RSK-ROOT"}]'::jsonb
    ELSE value->'riskTree' END),
  updated_at=now()
WHERE key='dictBundle';
