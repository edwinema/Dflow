-- Metadata for process attachments. File bytes remain in the existing files table.
CREATE TABLE flow_attachments (
  id text PRIMARY KEY CHECK(length(id) BETWEEN 1 AND 200),
  flow_id text NOT NULL CHECK(length(flow_id) BETWEEN 1 AND 200),
  att_no text NOT NULL CHECK(length(att_no) BETWEEN 1 AND 200),
  label text NOT NULL CHECK(length(label) BETWEEN 1 AND 255),
  category text NOT NULL DEFAULT '流程操作指引',
  file_size text NOT NULL DEFAULT '0 B',
  owner_name text NOT NULL DEFAULT '系统管理员',
  owner_id text NOT NULL REFERENCES users(id),
  file_id uuid REFERENCES files(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'approved' CHECK(status IN ('draft','approved','archived')),
  publish_time timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX flow_attachments_flow_att_no ON flow_attachments(flow_id, att_no);
CREATE INDEX flow_attachments_flow_id ON flow_attachments(flow_id, created_at DESC);
