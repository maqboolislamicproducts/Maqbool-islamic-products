-- Cancel online orders abandoned during checkout and release their reserved stock.
-- The checkout creates an order as 'confirmed' and decrements stock before payment is
-- captured. If a customer abandons the Razorpay modal (or closes the tab), the order is
-- left pending/failed with stock held. This job cancels those stale orders after a grace
-- period that comfortably exceeds Razorpay's 3-15 minute transaction timeout.

create or replace function public.cancel_stale_online_orders(p_timeout_minutes integer default 30)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  cancelled_count integer := 0;
  stale_order record;
begin
  for stale_order in
    select o.id
    from public.orders o
    where o.payment_method = 'online'
      and o.payment_status in ('pending', 'failed')
      and o.status = 'confirmed'
      and o.created_at < now() - make_interval(mins => p_timeout_minutes)
  loop
    update public.orders set payment_status = 'failed'
      where id = stale_order.id and payment_status <> 'paid';
    if found then
      perform public.set_market_order_status(stale_order.id, 'cancelled');
      cancelled_count := cancelled_count + 1;
    end if;
  end loop;
  return cancelled_count;
end;
$$;

revoke all on function public.cancel_stale_online_orders(integer) from public, anon, authenticated;
grant execute on function public.cancel_stale_online_orders(integer) to service_role;

-- Schedule an hourly cleanup when pg_cron is available (idempotent).
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('cancel-stale-online-orders');
    perform cron.schedule('cancel-stale-online-orders', '0 * * * *', 'select public.cancel_stale_online_orders(30)');
  end if;
end $$;
