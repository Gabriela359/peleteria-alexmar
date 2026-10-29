create or replace function public.eliminar_producto(p_ref text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_producto public.productos;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede eliminar productos';
  end if;

  select * into v_producto from public.productos where ref = p_ref for update;
  if not found then raise exception 'Producto % no existe', p_ref; end if;

  delete from public.productos where ref = p_ref;

end;
$$;

grant execute on function public.eliminar_producto(text) to authenticated;
