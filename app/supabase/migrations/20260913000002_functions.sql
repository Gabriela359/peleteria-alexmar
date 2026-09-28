-- ============================================================
-- Funciones y triggers de negocio.
-- Las funciones de mutación (registrar_venta, registrar_entrada,
-- registrar_ajuste, registrar_devolucion, archivar_producto,
-- ocultar_tipo_producto) son SECURITY DEFINER: corren con permisos
-- del dueño de la función (bypass de RLS) pero cada una valida el
-- rol del usuario que llama (auth.uid()) antes de tocar nada, y deja
-- registro en `movimientos` cuando corresponde.
-- ============================================================

-- ---------- helpers ----------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and rol = 'admin' and activo
  );
$$;

create or replace function public.nombre_actual()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select nombre from public.profiles where id = auth.uid();
$$;

-- Crea el perfil automáticamente cuando alguien se registra o es
-- invitado desde el dashboard de Supabase. Rol por defecto: vendedor
-- (promueve al primer administrador a mano, ver README).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nombre, correo, rol, activo)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
    new.email,
    'vendedor',
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- inventario: por talla o por unidad ----------
create or replace function public.pares_de(p_producto public.productos)
returns integer
language sql
immutable
as $$
  select case
    when p_producto.unidad = 'par' then
      coalesce((select sum(value::int) from jsonb_each_text(p_producto.tallas)), 0)
    else p_producto.stock
  end;
$$;

-- ---------- registrar_venta ----------
-- p_items: [{ "ref": "SU-101", "talla": "38", "pares": 2 }, ...]
create or replace function public.registrar_venta(
  p_items jsonb,
  p_metodo public.metodo_pago,
  p_cliente text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venta_id text;
  v_item jsonb;
  v_producto public.productos;
  v_stock_actual integer;
  v_total numeric(12,2) := 0;
  v_costo numeric(12,2) := 0;
  v_vendedor_nombre text;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and activo) then
    raise exception 'Usuario no válido o inactivo';
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception 'El carrito está vacío';
  end if;

  select nombre into v_vendedor_nombre from public.profiles where id = auth.uid();
  v_venta_id := 'F-' || nextval('public.venta_id_seq');

  insert into public.ventas (id, vendedor_id, vendedor_nombre, metodo, cliente, total, costo)
  values (v_venta_id, auth.uid(), v_vendedor_nombre, p_metodo, nullif(trim(coalesce(p_cliente, '')), ''), 0, 0);

  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_producto from public.productos where ref = (v_item ->> 'ref') for update;
    if not found then
      raise exception 'Producto % no existe', v_item ->> 'ref';
    end if;

    if (v_item ->> 'pares')::int <= 0 then
      raise exception 'La cantidad del producto % debe ser mayor que cero', v_producto.nombre;
    end if;

    if v_producto.unidad = 'par' then
      if (v_item ->> 'talla') is null or btrim(v_item ->> 'talla') = '' then
        raise exception 'El producto % se vende por talla y requiere una talla válida', v_producto.nombre;
      end if;
      if v_item ? 'talla' and v_item ->> 'talla' is not null and btrim(v_item ->> 'talla') <> '' and v_producto.unidad = 'unidad' then
        raise exception 'El producto % no acepta talla porque se vende por unidades', v_producto.nombre;
      end if;
      v_stock_actual := coalesce((v_producto.tallas ->> (v_item ->> 'talla'))::int, 0);
    else
      if v_item ? 'talla' and v_item ->> 'talla' is not null and btrim(v_item ->> 'talla') <> '' then
        raise exception 'El producto % se vende por unidades y no puede llevar talla', v_producto.nombre;
      end if;
      v_stock_actual := v_producto.stock;
    end if;

    if (v_item ->> 'pares')::int > v_stock_actual then
      raise exception 'No hay suficiente stock de % (quedan %)', v_producto.nombre, v_stock_actual;
    end if;

    insert into public.venta_items (venta_id, ref, nombre, talla, unidad, pares, precio, costo)
    values (
      v_venta_id, v_producto.ref, v_producto.nombre, v_item ->> 'talla', v_producto.unidad,
      (v_item ->> 'pares')::int, v_producto.precio, v_producto.costo
    );

    v_total := v_total + (v_item ->> 'pares')::int * v_producto.precio;
    v_costo := v_costo + (v_item ->> 'pares')::int * v_producto.costo;

    if v_producto.unidad = 'par' then
      update public.productos
        set tallas = jsonb_set(tallas, array[v_item ->> 'talla'], to_jsonb(v_stock_actual - (v_item ->> 'pares')::int)),
            updated_at = now()
        where ref = v_producto.ref;
    else
      update public.productos
        set stock = v_stock_actual - (v_item ->> 'pares')::int, updated_at = now()
        where ref = v_producto.ref;
    end if;
  end loop;

  update public.ventas set total = v_total, costo = v_costo where id = v_venta_id;
  return v_venta_id;
end;
$$;

grant execute on function public.registrar_venta(jsonb, public.metodo_pago, text) to authenticated;

-- ---------- registrar_devolucion ----------
create or replace function public.registrar_devolucion(p_venta_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venta public.ventas;
  v_item record;
  v_pares_totales integer := 0;
  v_primer_ref text;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede registrar devoluciones';
  end if;

  select * into v_venta from public.ventas where id = p_venta_id for update;
  if not found then raise exception 'Factura % no existe', p_venta_id; end if;
  if v_venta.devuelta then raise exception 'Esa factura ya fue devuelta'; end if;

  for v_item in select * from public.venta_items where venta_id = p_venta_id loop
    if v_primer_ref is null then v_primer_ref := v_item.ref; end if;
    v_pares_totales := v_pares_totales + v_item.pares;
    if v_item.unidad = 'par' then
      update public.productos
        set tallas = jsonb_set(
              tallas, array[v_item.talla],
              to_jsonb(coalesce((tallas ->> v_item.talla)::int, 0) + v_item.pares)
            ),
            updated_at = now()
        where ref = v_item.ref;
    else
      update public.productos set stock = stock + v_item.pares, updated_at = now() where ref = v_item.ref;
    end if;
  end loop;

  update public.ventas set devuelta = true where id = p_venta_id;

  insert into public.movimientos (tipo, producto_ref, modelo, detalle, quien, pares)
  select 'devolucion', v_primer_ref,
         v_primer_ref || ' · ' || (select nombre from public.productos where ref = v_primer_ref),
         'Devolución de la factura ' || p_venta_id, public.nombre_actual(), v_pares_totales;
end;
$$;

grant execute on function public.registrar_devolucion(text) to authenticated;

-- ---------- registrar_entrada ----------
-- p_tallas: { "38": 10, "39": 12, ... } si es por talla, o { "__u": 20 } por unidad.
create or replace function public.registrar_entrada(
  p_ref text,
  p_tallas jsonb,
  p_proveedor text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_producto public.productos;
  v_total integer := 0;
  v_detalle_tallas text := '';
  v_key text;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede registrar entradas de mercancía';
  end if;

  select * into v_producto from public.productos where ref = p_ref for update;
  if not found then raise exception 'Producto % no existe', p_ref; end if;

  if v_producto.unidad = 'par' then
    for v_key in select jsonb_object_keys(p_tallas) loop
      v_total := v_total + coalesce((p_tallas ->> v_key)::int, 0);
      if coalesce((p_tallas ->> v_key)::int, 0) > 0 then
        v_detalle_tallas := v_detalle_tallas || case when v_detalle_tallas = '' then '' else ', ' end || 'T' || v_key;
      end if;
    end loop;
    if v_total <= 0 then raise exception 'Indica cuántos pares entran'; end if;
    update public.productos
      set tallas = (
            select jsonb_object_agg(k, coalesce((v_producto.tallas ->> k)::int, 0) + coalesce((p_tallas ->> k)::int, 0))
            from (
              select k from jsonb_object_keys(v_producto.tallas) k
              union
              select k from jsonb_object_keys(p_tallas) k
            ) keys(k)
          ),
          updated_at = now()
      where ref = p_ref;
  else
    v_total := coalesce((p_tallas ->> '__u')::int, 0);
    if v_total <= 0 then raise exception 'Indica cuántas unidades entran'; end if;
    v_detalle_tallas := v_total || ' unidades';
    update public.productos set stock = stock + v_total, updated_at = now() where ref = p_ref;
  end if;

  insert into public.movimientos (tipo, producto_ref, modelo, detalle, quien, pares)
  values (
    'entrada', p_ref, p_ref || ' · ' || v_producto.nombre,
    coalesce(nullif(trim(p_proveedor), ''), 'Proveedor sin nombre') || ' · ' || v_detalle_tallas,
    public.nombre_actual(), v_total
  );
end;
$$;

grant execute on function public.registrar_entrada(text, jsonb, text) to authenticated;

-- ---------- registrar_ajuste ----------
create or replace function public.registrar_ajuste(
  p_ref text,
  p_talla text,
  p_valor integer,
  p_motivo text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_producto public.productos;
  v_actual integer;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede registrar ajustes de inventario';
  end if;

  select * into v_producto from public.productos where ref = p_ref for update;
  if not found then raise exception 'Producto % no existe', p_ref; end if;

  if v_producto.unidad = 'par' then
    v_actual := coalesce((v_producto.tallas ->> p_talla)::int, 0);
    update public.productos
      set tallas = jsonb_set(tallas, array[p_talla], to_jsonb(p_valor)), updated_at = now()
      where ref = p_ref;
  else
    v_actual := v_producto.stock;
    update public.productos set stock = p_valor, updated_at = now() where ref = p_ref;
  end if;

  insert into public.movimientos (tipo, producto_ref, modelo, detalle, quien, pares)
  values (
    'ajuste', p_ref, p_ref || ' · ' || v_producto.nombre,
    coalesce(p_motivo, 'Conteo físico') || ' · ' || coalesce('talla ' || p_talla, 'existencia') || ': ' || v_actual || ' → ' || p_valor,
    public.nombre_actual(), p_valor - v_actual
  );
end;
$$;

grant execute on function public.registrar_ajuste(text, text, integer, text) to authenticated;

-- ---------- archivar / reactivar producto ----------
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
  if not found then raise exception 'Producto % no existe', p_ref; end if;

  update public.productos set archivado = p_archivado, updated_at = now() where ref = p_ref;

  insert into public.movimientos (tipo, producto_ref, modelo, detalle, quien, pares)
  values (
    case when p_archivado then 'archivado' else 'reactivado' end,
    p_ref, p_ref || ' · ' || v_producto.nombre,
    case when p_archivado
      then 'Sale del catálogo de venta, conserva su historial y sus ' || public.pares_de(v_producto) || ' pares'
      else 'Vuelve al catálogo de venta'
    end,
    public.nombre_actual(), 0
  );
end;
$$;

grant execute on function public.archivar_producto(text, boolean) to authenticated;

-- ---------- ocultar tipo de producto (no se puede si está en uso) ----------
create or replace function public.ocultar_tipo_producto(p_nombre text, p_ocultar boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_en_uso integer;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede editar los tipos de producto';
  end if;

  if p_ocultar then
    select count(*) into v_en_uso from public.productos where tipo = p_nombre;
    if v_en_uso > 0 then
      raise exception 'No se puede eliminar: % producto(s) usan "%"', v_en_uso, p_nombre;
    end if;
  end if;

  update public.tipos_producto set activo = not p_ocultar where nombre = p_nombre;
end;
$$;

grant execute on function public.ocultar_tipo_producto(text, boolean) to authenticated;
