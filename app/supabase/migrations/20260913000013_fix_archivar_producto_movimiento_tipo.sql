create or replace function public.archivar_producto(p_ref text, p_archivado boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_producto public.productos;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede archivar productos';
  end if;

  select * into v_producto from public.productos where ref = p_ref for update;
  if not found then
    raise exception 'Producto % no existe', p_ref;
  end if;

  update public.productos
  set archivado = p_archivado, updated_at = now()
  where ref = p_ref;

  insert into public.movimientos (tipo, producto_ref, modelo, detalle, quien, pares)
  values (
    case
      when p_archivado then 'archivado'::public.movimiento_tipo
      else 'reactivado'::public.movimiento_tipo
    end,
    p_ref,
    p_ref || ' · ' || v_producto.nombre,
    case
      when p_archivado then
        'Sale del catálogo de venta, conserva su historial y sus '
          || public.pares_de(v_producto) || ' pares'
      else 'Vuelve al catálogo de venta'
    end,
    public.nombre_actual(),
    0
  );
end;
$$;

grant execute on function public.archivar_producto(text, boolean) to authenticated;
