-- Release coupon usage when an order that used a coupon is cancelled.
-- place_market_order increments coupons.usage_count; cancelling must decrement it.

create or replace function public.set_market_order_status(order_id_input uuid, status_input text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare selected_order public.orders%rowtype;
declare item record;
begin
  if status_input not in ('confirmed', 'processing', 'shipped', 'delivered', 'cancelled') then
    raise exception 'Unsupported order status.';
  end if;
  select * into selected_order from public.orders where id = order_id_input for update;
  if not found then raise exception 'Order not found.'; end if;
  if selected_order.status = 'cancelled' and status_input <> 'cancelled' then
    raise exception 'A cancelled order cannot be reopened.';
  end if;
  if status_input = 'cancelled' and selected_order.stock_restored_at is null then
    for item in select variant_id, quantity from public.order_items where order_id = order_id_input and variant_id is not null
    loop
      update public.product_variants set stock = stock + item.quantity where id = item.variant_id;
    end loop;
    update public.orders set stock_restored_at = now() where id = order_id_input;
  end if;
  if status_input = 'cancelled' and selected_order.status <> 'cancelled' and selected_order.coupon_code is not null then
    update public.coupons set usage_count = greatest(usage_count - 1, 0)
      where code = selected_order.coupon_code and usage_count > 0;
  end if;
  update public.orders set status = status_input where id = order_id_input;
end;
$$;

revoke all on function public.set_market_order_status(uuid, text) from public, anon, authenticated;
grant execute on function public.set_market_order_status(uuid, text) to service_role;
