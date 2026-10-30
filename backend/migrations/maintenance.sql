-- Optional daily maintenance, run by an operator/scheduler with appropriate privileges.
-- Audit logs and publication history are deliberately NOT removed here.
DELETE FROM sessions WHERE expires_at < now() - interval '1 day';
DELETE FROM rate_limits WHERE window_start < now() - interval '1 day';
-- Idempotency keys may be reused after this retention period. Document that policy for API callers.
DELETE FROM request_receipts WHERE created_at < now() - interval '7 days';
