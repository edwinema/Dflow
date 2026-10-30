-- QingProcess PostgreSQL 16+. Single enterprise deployment.
-- Business aggregates retain extensible frontend payloads in JSONB, one row per aggregate.
-- Authentication, sessions, versions, files and mining events use dedicated relational tables.
CREATE TABLE schema_migrations(version text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now());

CREATE TABLE flow_architectures (
  id text PRIMARY KEY CHECK(length(id) BETWEEN 1 AND 200),
  payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='object'),
  sort_order integer NOT NULL DEFAULT 0,
  revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(COALESCE(payload->>'id',payload->>'formKey') IS NOT NULL),
  CHECK(COALESCE(payload->>'id',payload->>'formKey')=id)
);
CREATE INDEX flow_architectures_ordering ON flow_architectures(sort_order,id);

CREATE TABLE flow_models (
  id text PRIMARY KEY CHECK(length(id) BETWEEN 1 AND 200),
  payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='object'),
  sort_order integer NOT NULL DEFAULT 0,
  revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(COALESCE(payload->>'id',payload->>'formKey') IS NOT NULL),
  CHECK(COALESCE(payload->>'id',payload->>'formKey')=id)
);
CREATE INDEX flow_models_ordering ON flow_models(sort_order,id);

CREATE TABLE flow_audits (
  id text PRIMARY KEY CHECK(length(id) BETWEEN 1 AND 200),
  payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='object'),
  sort_order integer NOT NULL DEFAULT 0,
  revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(COALESCE(payload->>'id',payload->>'formKey') IS NOT NULL),
  CHECK(COALESCE(payload->>'id',payload->>'formKey')=id)
);
CREATE INDEX flow_audits_ordering ON flow_audits(sort_order,id);

CREATE TABLE flow_repeals (
  id text PRIMARY KEY CHECK(length(id) BETWEEN 1 AND 200),
  payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='object'),
  sort_order integer NOT NULL DEFAULT 0,
  revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(COALESCE(payload->>'id',payload->>'formKey') IS NOT NULL),
  CHECK(COALESCE(payload->>'id',payload->>'formKey')=id)
);
CREATE INDEX flow_repeals_ordering ON flow_repeals(sort_order,id);

CREATE TABLE execution_tasks (
  id text PRIMARY KEY CHECK(length(id) BETWEEN 1 AND 200),
  payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='object'),
  sort_order integer NOT NULL DEFAULT 0,
  revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(COALESCE(payload->>'id',payload->>'formKey') IS NOT NULL),
  CHECK(COALESCE(payload->>'id',payload->>'formKey')=id)
);
CREATE INDEX execution_tasks_ordering ON execution_tasks(sort_order,id);

CREATE TABLE duty_definitions (
  id text PRIMARY KEY CHECK(length(id) BETWEEN 1 AND 200),
  payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='object'),
  sort_order integer NOT NULL DEFAULT 0,
  revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(COALESCE(payload->>'id',payload->>'formKey') IS NOT NULL),
  CHECK(COALESCE(payload->>'id',payload->>'formKey')=id)
);
CREATE INDEX duty_definitions_ordering ON duty_definitions(sort_order,id);

CREATE TABLE duty_categories (
  id text PRIMARY KEY CHECK(length(id) BETWEEN 1 AND 200),
  payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='object'),
  sort_order integer NOT NULL DEFAULT 0,
  revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(COALESCE(payload->>'id',payload->>'formKey') IS NOT NULL),
  CHECK(COALESCE(payload->>'id',payload->>'formKey')=id)
);
CREATE INDEX duty_categories_ordering ON duty_categories(sort_order,id);

CREATE TABLE departments (
  id text PRIMARY KEY CHECK(length(id) BETWEEN 1 AND 200),
  payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='object'),
  sort_order integer NOT NULL DEFAULT 0,
  revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(COALESCE(payload->>'id',payload->>'formKey') IS NOT NULL),
  CHECK(COALESCE(payload->>'id',payload->>'formKey')=id)
);
CREATE INDEX departments_ordering ON departments(sort_order,id);

CREATE TABLE users (
  id text PRIMARY KEY CHECK(length(id) BETWEEN 1 AND 200),
  payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='object'),
  sort_order integer NOT NULL DEFAULT 0,
  revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(COALESCE(payload->>'id',payload->>'formKey') IS NOT NULL),
  CHECK(COALESCE(payload->>'id',payload->>'formKey')=id)
);
CREATE INDEX users_ordering ON users(sort_order,id);

CREATE TABLE positions (
  id text PRIMARY KEY CHECK(length(id) BETWEEN 1 AND 200),
  payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='object'),
  sort_order integer NOT NULL DEFAULT 0,
  revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(COALESCE(payload->>'id',payload->>'formKey') IS NOT NULL),
  CHECK(COALESCE(payload->>'id',payload->>'formKey')=id)
);
CREATE INDEX positions_ordering ON positions(sort_order,id);

CREATE TABLE job_titles (
  id text PRIMARY KEY CHECK(length(id) BETWEEN 1 AND 200),
  payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='object'),
  sort_order integer NOT NULL DEFAULT 0,
  revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(COALESCE(payload->>'id',payload->>'formKey') IS NOT NULL),
  CHECK(COALESCE(payload->>'id',payload->>'formKey')=id)
);
CREATE INDEX job_titles_ordering ON job_titles(sort_order,id);

CREATE TABLE organization_roles (
  id text PRIMARY KEY CHECK(length(id) BETWEEN 1 AND 200),
  payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='object'),
  sort_order integer NOT NULL DEFAULT 0,
  revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(COALESCE(payload->>'id',payload->>'formKey') IS NOT NULL),
  CHECK(COALESCE(payload->>'id',payload->>'formKey')=id)
);
CREATE INDEX organization_roles_ordering ON organization_roles(sort_order,id);

CREATE TABLE process_roles (
  id text PRIMARY KEY CHECK(length(id) BETWEEN 1 AND 200),
  payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='object'),
  sort_order integer NOT NULL DEFAULT 0,
  revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(COALESCE(payload->>'id',payload->>'formKey') IS NOT NULL),
  CHECK(COALESCE(payload->>'id',payload->>'formKey')=id)
);
CREATE INDEX process_roles_ordering ON process_roles(sort_order,id);

CREATE TABLE role_categories (
  id text PRIMARY KEY CHECK(length(id) BETWEEN 1 AND 200),
  payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='object'),
  sort_order integer NOT NULL DEFAULT 0,
  revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(COALESCE(payload->>'id',payload->>'formKey') IS NOT NULL),
  CHECK(COALESCE(payload->>'id',payload->>'formKey')=id)
);
CREATE INDEX role_categories_ordering ON role_categories(sort_order,id);

CREATE TABLE flow_terms (
  id text PRIMARY KEY CHECK(length(id) BETWEEN 1 AND 200),
  payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='object'),
  sort_order integer NOT NULL DEFAULT 0,
  revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(COALESCE(payload->>'id',payload->>'formKey') IS NOT NULL),
  CHECK(COALESCE(payload->>'id',payload->>'formKey')=id)
);
CREATE INDEX flow_terms_ordering ON flow_terms(sort_order,id);

CREATE TABLE term_categories (
  id text PRIMARY KEY CHECK(length(id) BETWEEN 1 AND 200),
  payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='object'),
  sort_order integer NOT NULL DEFAULT 0,
  revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(COALESCE(payload->>'id',payload->>'formKey') IS NOT NULL),
  CHECK(COALESCE(payload->>'id',payload->>'formKey')=id)
);
CREATE INDEX term_categories_ordering ON term_categories(sort_order,id);

CREATE TABLE form_schemas (
  id text PRIMARY KEY CHECK(length(id) BETWEEN 1 AND 200),
  payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='object'),
  sort_order integer NOT NULL DEFAULT 0,
  revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(COALESCE(payload->>'id',payload->>'formKey') IS NOT NULL),
  CHECK(COALESCE(payload->>'id',payload->>'formKey')=id)
);
CREATE INDEX form_schemas_ordering ON form_schemas(sort_order,id);

CREATE TABLE duty_manuals (
  id text PRIMARY KEY CHECK(length(id) BETWEEN 1 AND 200),
  payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='object'),
  sort_order integer NOT NULL DEFAULT 0,
  revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(COALESCE(payload->>'id',payload->>'formKey') IS NOT NULL),
  CHECK(COALESCE(payload->>'id',payload->>'formKey')=id)
);
CREATE INDEX duty_manuals_ordering ON duty_manuals(sort_order,id);

CREATE TABLE duty_audits (
  id text PRIMARY KEY CHECK(length(id) BETWEEN 1 AND 200),
  payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='object'),
  sort_order integer NOT NULL DEFAULT 0,
  revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(COALESCE(payload->>'id',payload->>'formKey') IS NOT NULL),
  CHECK(COALESCE(payload->>'id',payload->>'formKey')=id)
);
CREATE INDEX duty_audits_ordering ON duty_audits(sort_order,id);

CREATE TABLE api_definitions (
  id text PRIMARY KEY CHECK(length(id) BETWEEN 1 AND 200),
  payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='object'),
  sort_order integer NOT NULL DEFAULT 0,
  revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(COALESCE(payload->>'id',payload->>'formKey') IS NOT NULL),
  CHECK(COALESCE(payload->>'id',payload->>'formKey')=id)
);
CREATE INDEX api_definitions_ordering ON api_definitions(sort_order,id);

CREATE UNIQUE INDEX users_username ON users(lower(payload->>'userName'));
CREATE UNIQUE INDEX departments_code ON departments((payload->>'deptCode'));
CREATE UNIQUE INDEX process_roles_code ON process_roles(lower(payload->>'roleCode'));
CREATE UNIQUE INDEX form_schemas_key ON form_schemas((payload->>'formKey'));
ALTER TABLE users ADD CONSTRAINT no_plaintext_password CHECK(NOT (payload ? 'password') AND NOT (payload ? 'passwordHash'));
CREATE TABLE credentials(user_id text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, password_hash text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE sessions(token_hash text PRIMARY KEY, user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX sessions_user ON sessions(user_id);
CREATE INDEX sessions_expiry ON sessions(expires_at);
CREATE TABLE rate_limits(key text PRIMARY KEY, window_start timestamptz NOT NULL, hits integer NOT NULL CHECK(hits>0));
CREATE TABLE app_settings(key text PRIMARY KEY, value jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE audit_log(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, request_id uuid NOT NULL, actor_id text NOT NULL, method text NOT NULL, route text NOT NULL, changed_entities jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX audit_log_actor_time ON audit_log(actor_id,created_at DESC);
CREATE TABLE request_receipts(actor_id text NOT NULL, key text NOT NULL, fingerprint text NOT NULL, response jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(actor_id,key));
CREATE TABLE publication_versions(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, target_type text NOT NULL CHECK(target_type IN ('arch','flow')), target_id text NOT NULL, version_no text NOT NULL, snapshot jsonb NOT NULL, published_by text NOT NULL, published_at timestamptz NOT NULL DEFAULT now(), UNIQUE(target_type,target_id,version_no));
CREATE TABLE files(id uuid PRIMARY KEY, filename text NOT NULL, content_type text NOT NULL, content bytea NOT NULL CHECK(octet_length(content)<=5242880), owner_id text NOT NULL REFERENCES users(id), sha256 text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE mining_datasets(key text PRIMARY KEY, title text NOT NULL, domain text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE mining_events(id text PRIMARY KEY, dataset_key text NOT NULL REFERENCES mining_datasets(key), case_id text NOT NULL, activity text NOT NULL, event_time timestamptz NOT NULL, source_system text NOT NULL, operator text NOT NULL DEFAULT '', payload jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX mining_events_case_time ON mining_events(dataset_key,case_id,event_time);
CREATE TABLE mining_preferences(user_id text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, dataset_key text NOT NULL REFERENCES mining_datasets(key));
CREATE INDEX flow_audits_model_status ON flow_audits((payload->>'modelId'),(payload->>'auditStatus'));
CREATE UNIQUE INDEX flow_audits_pending ON flow_audits((payload->>'modelId')) WHERE payload->>'auditStatus'='待审核';
CREATE UNIQUE INDEX duty_audits_pending ON duty_audits((payload->>'manualId'),(payload->>'dutyItemId')) WHERE payload->>'status' IN ('待审核','审核中');
-- Relational generated keys enforce the stable aggregate relationships while keeping API payloads intact.
ALTER TABLE flow_models ADD COLUMN architecture_id text GENERATED ALWAYS AS (NULLIF(payload->>'parentId','')) STORED REFERENCES flow_architectures(id) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE execution_tasks ADD COLUMN model_id text GENERATED ALWAYS AS (NULLIF(payload->>'modelId','')) STORED REFERENCES flow_models(id) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE flow_audits ADD COLUMN model_id text GENERATED ALWAYS AS (NULLIF(payload->>'modelId','')) STORED REFERENCES flow_models(id) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE flow_repeals ADD COLUMN model_id text GENERATED ALWAYS AS (NULLIF(payload->>'modelId','')) STORED REFERENCES flow_models(id) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE duty_audits ADD COLUMN manual_id text GENERATED ALWAYS AS (NULLIF(payload->>'manualId','')) STORED REFERENCES duty_manuals(id) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE users ADD COLUMN department_id text GENERATED ALWAYS AS (NULLIF(payload->>'deptId','')) STORED REFERENCES departments(id) DEFERRABLE INITIALLY DEFERRED;
CREATE INDEX users_department ON users(department_id);
CREATE INDEX flow_models_architecture ON flow_models(architecture_id);
CREATE INDEX execution_tasks_model ON execution_tasks(model_id);
