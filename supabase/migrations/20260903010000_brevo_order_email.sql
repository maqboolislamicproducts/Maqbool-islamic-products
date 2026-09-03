-- Track transactional order confirmations so retries are idempotent.
alter table public.orders add column if not exists confirmation_email_sent_at timestamptz;
