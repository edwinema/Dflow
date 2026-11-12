-- Repair only the legacy omission backed by an actual matching publication record.
-- Explicit drafts and never-published architecture nodes must remain unpublished.
UPDATE flow_architectures a
SET payload=jsonb_set(a.payload,'{status}','"published"'::jsonb)
WHERE COALESCE(a.payload->>'status','')=''
  AND EXISTS (SELECT 1 FROM publication_versions v
              WHERE v.target_type='arch' AND v.target_id=a.id
                AND v.version_no=a.payload->>'versionNo');
