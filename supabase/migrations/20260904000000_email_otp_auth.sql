-- Server-side email OTP challenges for customer authentication.
create table if not exists public.email_otp_challenges (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  purpose text not null check (purpose in ('login', 'register')),
  code_hash text not null,
  name text,
  phone text,
  attempts integer not null default 0 check (attempts >= 0),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  last_sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists email_otp_challenges_lookup_idx
  on public.email_otp_challenges(email, purpose, created_at desc);
create index if not exists email_otp_challenges_expiry_idx
  on public.email_otp_challenges(expires_at);
alter table public.email_otp_challenges enable row level security;
revoke all on public.email_otp_challenges from public, anon, authenticated;
