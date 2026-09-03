-- Persist Razorpay identifiers and replace the simulated online-payment state.

alter table public.orders add column if not exists razorpay_order_id text;
alter table public.orders add column if not exists razorpay_payment_id text;
alter table public.orders add column if not exists razorpay_signature text;
alter table public.orders add column if not exists payment_verified_at timestamptz;
alter table public.orders add column if not exists confirmation_email_sent_at timestamptz;

create unique index if not exists orders_razorpay_order_id_unique
  on public.orders(razorpay_order_id) where razorpay_order_id is not null;
create unique index if not exists orders_razorpay_payment_id_unique
  on public.orders(razorpay_payment_id) where razorpay_payment_id is not null;

-- Existing deployments use the latest definition from admin_operations. Keep
-- its server-side pricing and inventory logic, changing only the initial state.
create or replace function public.set_online_payments_pending()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if new.payment_method = 'online' and new.payment_status = 'simulated' then
    new.payment_status := 'pending';
  end if;
  return new;
end;
$$;

drop trigger if exists set_online_payments_pending on public.orders;
create trigger set_online_payments_pending before insert on public.orders
for each row execute function public.set_online_payments_pending();

update public.orders set payment_status = 'pending'
where payment_method = 'online' and payment_status = 'simulated';
