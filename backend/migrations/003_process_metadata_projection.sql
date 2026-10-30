-- Queryable projections for the fields introduced by the updated flow cards.
-- The JSONB payload remains the source of truth so older and future dynamic fields stay compatible.
ALTER TABLE flow_architectures
  ADD COLUMN arch_no text GENERATED ALWAYS AS (NULLIF(payload->>'archNo','')) STORED,
  ADD COLUMN flow_level text GENERATED ALWAYS AS (COALESCE(NULLIF(payload->>'flowLevel',''), NULLIF(payload->>'level',''))) STORED,
  ADD COLUMN business_scope text GENERATED ALWAYS AS (NULLIF(payload->>'businessScope','')) STORED,
  ADD COLUMN applicable_scope text GENERATED ALWAYS AS (COALESCE(NULLIF(payload->>'applicableScope',''), NULLIF(payload->>'adaptScope',''))) STORED,
  ADD COLUMN dept_name text GENERATED ALWAYS AS (NULLIF(payload->>'deptName','')) STORED,
  ADD COLUMN owner_name text GENERATED ALWAYS AS (NULLIF(payload->>'ownerName','')) STORED;

ALTER TABLE flow_models
  ADD COLUMN flow_no text GENERATED ALWAYS AS (NULLIF(payload->>'flowNo','')) STORED,
  ADD COLUMN flow_level text GENERATED ALWAYS AS (COALESCE(NULLIF(payload->>'flowLevel',''), NULLIF(payload->>'level',''))) STORED,
  ADD COLUMN business_scope text GENERATED ALWAYS AS (NULLIF(payload->>'businessScope','')) STORED,
  ADD COLUMN applicable_scope text GENERATED ALWAYS AS (COALESCE(NULLIF(payload->>'applicableScope',''), NULLIF(payload->>'adaptScope',''))) STORED,
  ADD COLUMN dept_name text GENERATED ALWAYS AS (NULLIF(payload->>'deptName','')) STORED,
  ADD COLUMN owner_name text GENERATED ALWAYS AS (NULLIF(payload->>'ownerName','')) STORED;

CREATE INDEX flow_architectures_metadata_lookup
  ON flow_architectures(arch_no, flow_level, dept_name, owner_name);
CREATE INDEX flow_architectures_scope_lookup
  ON flow_architectures USING btree(applicable_scope);
CREATE INDEX flow_models_metadata_lookup
  ON flow_models(flow_no, flow_level, dept_name, owner_name);
CREATE INDEX flow_models_scope_lookup
  ON flow_models USING btree(applicable_scope);
