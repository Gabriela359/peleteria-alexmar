-- Inventario sin tipos ni fotos; cada producto controla stock total o por talla.

drop function if exists public.ocultar_tipo_producto(text, boolean);
drop function if exists public.registrar_entrada(text, jsonb, text);
drop function if exists public.registrar_ajuste(text, text, integer, text);

alter table public.productos
  add column if not exists modo_stock text;

update public.productos
set modo_stock = case when unidad = 'unidad' then 'total' else 'talla' end
where modo_stock is null;

alter table public.productos
  alter column modo_stock set default 'talla',
  alter column modo_stock set not null;

alter table public.productos
  drop constraint if exists productos_modo_stock_check,
  add constraint productos_modo_stock_check check (modo_stock in ('total', 'talla'));

drop index if exists public.productos_tipo_idx;

alter table public.productos
  drop column if exists tipo,
  drop column if exists foto_url;

drop table if exists public.tipos_producto;

drop policy if exists "productos_fotos_select" on storage.objects;
drop policy if exists "productos_fotos_admin_write" on storage.objects;
drop policy if exists "productos_fotos_admin_update" on storage.objects;
drop policy if exists "productos_fotos_admin_delete" on storage.objects;

-- Storage protege sus tablas: los objetos y el bucket se eliminan por su API,
-- no con DELETE desde SQL. Ver README para limpiar el bucket existente.

alter table public.venta_items
  alter column ref drop not null,
  drop constraint if exists venta_items_ref_fkey,
  add constraint venta_items_ref_fkey
    foreign key (ref) references public.productos (ref) on delete set null;

alter table public.movimientos
  drop constraint if exists movimientos_producto_ref_fkey,
  add constraint movimientos_producto_ref_fkey
    foreign key (producto_ref) references public.productos (ref) on delete set null;

create or replace function public.pares_de(p_producto public.productos)
returns integer
language sql
immutable
as $$
  select case
    when p_producto.modo_stock = 'talla' then
      coalesce((select sum(value::int) from jsonb_each_text(p_producto.tallas)), 0)
    else p_producto.stock
  end;
$$;

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
  v_talla text;
  v_cantidad integer;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and activo) then
    raise exception 'Usuario no válido o inactivo';
  end if;
  if not exists (select 1 from public.cajas where fecha = current_date and estado = 'abierta') then
    raise exception 'Debes abrir la caja del día antes de registrar ventas';
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
    if not found then raise exception 'Producto % no existe', v_item ->> 'ref'; end if;

    v_cantidad := (v_item ->> 'pares')::int;
    v_talla := nullif(btrim(v_item ->> 'talla'), '');
    if v_cantidad <= 0 then raise exception 'La cantidad del producto % debe ser mayor que cero', v_producto.nombre; end if;

    if v_producto.modo_stock = 'talla' then
      if v_talla is null then raise exception 'El producto % requiere una talla', v_producto.nombre; end if;
      v_stock_actual := coalesce((v_producto.tallas ->> v_talla)::int, 0);
    else
      if v_talla is not null then raise exception 'El producto % se vende por cantidad total y no requiere talla', v_producto.nombre; end if;
      v_stock_actual := v_producto.stock;
    end if;

    if v_cantidad > v_stock_actual then
      raise exception 'No hay suficiente stock de % (quedan %)', v_producto.nombre, v_stock_actual;
    end if;

    insert into public.venta_items (venta_id, ref, nombre, talla, unidad, pares, precio, costo)
    values (v_venta_id, v_producto.ref, v_producto.nombre, v_talla, v_producto.unidad,
      v_cantidad, v_producto.precio, v_producto.costo);

    v_total := v_total + v_cantidad * v_producto.precio;
    v_costo := v_costo + v_cantidad * v_producto.costo;

    if v_producto.modo_stock = 'talla' then
      update public.productos
        set tallas = jsonb_set(tallas, array[v_talla], to_jsonb(v_stock_actual - v_cantidad)),
            updated_at = now()
        where ref = v_producto.ref;
    else
      update public.productos set stock = stock - v_cantidad, updated_at = now() where ref = v_producto.ref;
    end if;
  end loop;

  update public.ventas set total = v_total, costo = v_costo where id = v_venta_id;

  perform public.registrar_auditoria(
    'CREAR_VENTA',
    'VENTAS',
    'ventas',
    v_venta_id,
    'success',
    'info',
    jsonb_build_object(
      'metodo', p_metodo,
      'items_count', jsonb_array_length(p_items),
      'cliente', nullif(trim(coalesce(p_cliente, '')), ''),
      'total', v_total,
      'costo', v_costo
    )
  );
  return v_venta_id;
end;
$$;

grant execute on function public.registrar_venta(jsonb, public.metodo_pago, text) to authenticated;

create or replace function public.registrar_devolucion(p_venta_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venta public.ventas;
  v_item record;
  v_producto public.productos;
  v_pares_totales integer := 0;
  v_primer_ref text;
begin
  if not public.is_admin() then raise exception 'Solo un administrador puede registrar devoluciones'; end if;
  select * into v_venta from public.ventas where id = p_venta_id for update;
  if not found then raise exception 'Factura % no existe', p_venta_id; end if;
  if v_venta.devuelta then raise exception 'Esa factura ya fue devuelta'; end if;

  for v_item in select * from public.venta_items where venta_id = p_venta_id loop
    if v_primer_ref is null and v_item.ref is not null then v_primer_ref := v_item.ref; end if;
    v_pares_totales := v_pares_totales + v_item.pares;
    if v_item.ref is null then
      continue;
    end if;
    select * into v_producto from public.productos where ref = v_item.ref for update;
    if not found then
      continue;
    end if;
    if v_producto.modo_stock = 'talla' then
      if v_item.talla is null then
        raise exception 'No se puede devolver el producto % por talla: la venta original no guardó talla', v_producto.nombre;
      end if;
      update public.productos
        set tallas = jsonb_set(tallas, array[v_item.talla],
          to_jsonb(coalesce((tallas ->> v_item.talla)::int, 0) + v_item.pares), true),
          updated_at = now()
        where ref = v_item.ref;
    else
      update public.productos set stock = stock + v_item.pares, updated_at = now() where ref = v_item.ref;
    end if;
  end loop;

  update public.ventas set devuelta = true where id = p_venta_id;
  insert into public.movimientos (tipo, producto_ref, modelo, detalle, quien, pares)
  select 'devolucion', v_primer_ref,
    coalesce(v_primer_ref || ' · ' || (select nombre from public.productos where ref = v_primer_ref), 'Producto eliminado'),
    'Devolución de la factura ' || p_venta_id, public.nombre_actual(), v_pares_totales;

  perform public.registrar_auditoria(
    'CREAR_DEVOLUCION',
    'VENTAS',
    'ventas',
    p_venta_id,
    'success',
    'info',
    jsonb_build_object(
      'items_count', (select count(*) from public.venta_items where venta_id = p_venta_id),
      'pares_totales', v_pares_totales,
      'total_venta', v_venta.total
    )
  );
end;
$$;

grant execute on function public.registrar_devolucion(text) to authenticated;

create or replace function public.crear_producto(
  p_ref text,
  p_nombre text,
  p_color text,
  p_precio numeric,
  p_costo numeric,
  p_min integer,
  p_modo_stock text,
  p_tallas jsonb,
  p_stock integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref text := upper(btrim(p_ref));
  v_nombre text := btrim(p_nombre);
  v_total integer;
  v_rango text;
  v_detalle_tallas text;
begin
  if not public.is_admin() then raise exception 'Solo un administrador puede crear productos'; end if;
  if v_ref = '' or v_nombre = '' then raise exception 'Referencia y nombre son obligatorios'; end if;
  if p_modo_stock is null or p_modo_stock not in ('total', 'talla') then raise exception 'Forma de control de stock inválida'; end if;
  if p_tallas is null or jsonb_typeof(p_tallas) <> 'object' or p_tallas = '{}'::jsonb then
    raise exception 'Indica un rango de tallas válido';
  end if;
  if exists (
    select 1 from jsonb_each_text(p_tallas) e
    where e.key !~ '^[0-9]{1,2}$' or e.value !~ '^[0-9]+$'
  ) then raise exception 'Las tallas y cantidades deben ser números enteros no negativos'; end if;
  if exists (select 1 from jsonb_each_text(p_tallas) e where e.key::int < 1 or e.key::int > 99) then
    raise exception 'Las tallas deben estar entre 1 y 99';
  end if;

  if p_modo_stock = 'total' then
    if p_stock is null or p_stock <= 0 then raise exception 'Indica la cantidad total inicial'; end if;
    if exists (select 1 from jsonb_each_text(p_tallas) e where e.value::int <> 0) then
      raise exception 'El inventario total no admite cantidades separadas por talla';
    end if;
    v_total := p_stock;
  else
    if p_stock <> 0 then raise exception 'El inventario por talla no admite una cantidad total'; end if;
    v_total := (select coalesce(sum(value::int), 0) from jsonb_each_text(p_tallas));
  end if;

  select min(key::int)::text || '-' || max(key::int)::text into v_rango from jsonb_each(p_tallas);
  select string_agg(key || ': ' || value, ', ' order by key::int)
    into v_detalle_tallas from jsonb_each_text(p_tallas);

  insert into public.productos (ref, nombre, unidad, modo_stock, color, precio, costo, min, tallas, stock)
  values (v_ref, v_nombre, 'par', p_modo_stock, nullif(btrim(coalesce(p_color, '')), ''),
    coalesce(p_precio, 0), coalesce(p_costo, 0), greatest(coalesce(p_min, 0), 0),
    p_tallas, case when p_modo_stock = 'total' then p_stock else 0 end);

  if v_total > 0 then
    insert into public.movimientos (tipo, producto_ref, modelo, detalle, quien, pares)
    values ('entrada', v_ref, v_ref || ' · ' || v_nombre,
      'Stock inicial · ' || case when p_modo_stock = 'total' then 'cantidad total' else 'por talla: ' || v_detalle_tallas end || ' · tallas ' || v_rango,
      public.nombre_actual(), v_total);
  end if;

  perform public.registrar_auditoria(
    'CREAR_PRODUCTO',
    'INVENTARIO',
    'productos',
    v_ref,
    'success',
    'info',
    jsonb_build_object('modo_stock', p_modo_stock, 'cantidad_inicial', v_total, 'tallas', p_tallas)
  );
end;
$$;

grant execute on function public.crear_producto(text, text, text, numeric, numeric, integer, text, jsonb, integer) to authenticated;

create or replace function public.registrar_entrada(
  p_ref text,
  p_modo_stock text,
  p_tallas jsonb,
  p_stock integer,
  p_proveedor text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_producto public.productos;
  v_total_actual integer;
  v_total_nuevo integer;
  v_detalle text;
  v_rango text;
  v_detalle_tallas text;
  v_tallas_nuevas jsonb;
begin
  if not public.is_admin() then raise exception 'Solo un administrador puede registrar entradas de mercancía'; end if;
  if p_modo_stock is null or p_modo_stock not in ('total', 'talla') then raise exception 'Forma de control de stock inválida'; end if;
  select * into v_producto from public.productos where ref = p_ref for update;
  if not found then raise exception 'Producto % no existe', p_ref; end if;
  v_total_actual := public.pares_de(v_producto);

  if p_modo_stock = 'total' then
    if coalesce(p_stock, 0) <= 0 then raise exception 'Indica cuántos pares entran'; end if;
    if v_producto.modo_stock = 'talla' then
      select coalesce(jsonb_object_agg(key, 0), '{}'::jsonb) into v_tallas_nuevas
        from jsonb_object_keys(v_producto.tallas) as size_keys(key);
    else
      v_tallas_nuevas := v_producto.tallas;
    end if;
    update public.productos set modo_stock = 'total', tallas = v_tallas_nuevas,
      stock = v_total_actual + p_stock, updated_at = now() where ref = p_ref;
    v_total_nuevo := p_stock;
    v_detalle := 'Entrada total +' || p_stock || ' pares';
  else
    if p_tallas is null or jsonb_typeof(p_tallas) <> 'object' or p_tallas = '{}'::jsonb then
      raise exception 'Indica las cantidades por talla';
    end if;
    if exists (select 1 from jsonb_each_text(p_tallas) e where e.key !~ '^[0-9]{1,2}$' or e.value !~ '^[0-9]+$') then
      raise exception 'Las tallas y cantidades deben ser números enteros no negativos';
    end if;
    v_total_nuevo := (select coalesce(sum(value::int), 0) from jsonb_each_text(p_tallas));
    if v_total_nuevo <= 0 then raise exception 'Indica cuántos pares entran por talla'; end if;
    select min(key::int)::text || '-' || max(key::int)::text into v_rango from jsonb_each(p_tallas);
    select string_agg(key || ': +' || value, ', ' order by key::int)
      into v_detalle_tallas from jsonb_each_text(p_tallas);

    if v_producto.modo_stock = 'total' then
      update public.productos set modo_stock = 'talla', tallas = p_tallas, stock = 0,
        updated_at = now() where ref = p_ref;
      insert into public.movimientos (tipo, producto_ref, modelo, detalle, quien, pares)
      values ('ajuste', p_ref, p_ref || ' · ' || v_producto.nombre,
        'Cambio de control total a por talla · stock anterior ' || v_total_actual || ' · nuevo desglose ' || v_detalle_tallas,
        public.nombre_actual(), v_total_nuevo - v_total_actual);
      perform public.registrar_auditoria(
        'CAMBIO_CONTROL_INVENTARIO',
        'INVENTARIO',
        'productos',
        p_ref,
        'success',
        'warning',
        jsonb_build_object('modo_stock_anterior', 'total', 'modo_stock_nuevo', 'talla', 'stock_anterior', v_total_actual, 'tallas', p_tallas)
      );
      return;
    else
      select coalesce(jsonb_object_agg(k, coalesce((v_producto.tallas ->> k)::int, 0) + coalesce((p_tallas ->> k)::int, 0)), '{}'::jsonb)
        into v_tallas_nuevas
        from (
          select key as k from jsonb_object_keys(v_producto.tallas) as existing_sizes(key)
          union
          select key as k from jsonb_object_keys(p_tallas) as incoming_sizes(key)
        ) sizes;
      update public.productos set tallas = v_tallas_nuevas, updated_at = now() where ref = p_ref;
      v_detalle := 'Entrada por talla · ' || v_detalle_tallas;
    end if;
  end if;

  insert into public.movimientos (tipo, producto_ref, modelo, detalle, quien, pares)
  values ('entrada', p_ref, p_ref || ' · ' || v_producto.nombre,
    coalesce(nullif(btrim(p_proveedor), ''), 'Proveedor sin nombre') || ' · ' || v_detalle,
    public.nombre_actual(), v_total_nuevo);

  perform public.registrar_auditoria(
    'ENTRADA_INVENTARIO',
    'INVENTARIO',
    'productos',
    p_ref,
    'success',
    'info',
    jsonb_build_object(
      'proveedor', coalesce(nullif(trim(p_proveedor), ''), 'Proveedor sin nombre'),
      'cantidad', v_total_nuevo,
      'modo_stock', p_modo_stock,
      'tallas', p_tallas
    )
  );
end;
$$;

grant execute on function public.registrar_entrada(text, text, jsonb, integer, text) to authenticated;

create or replace function public.registrar_ajuste(
  p_ref text,
  p_modo_stock text,
  p_tallas jsonb,
  p_stock integer,
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
  v_total_actual integer;
  v_total_nuevo integer;
  v_actual integer;
  v_tallas_nuevas jsonb;
  v_detalle text;
  v_detalle_tallas text;
begin
  if not public.is_admin() then raise exception 'Solo un administrador puede registrar ajustes de inventario'; end if;
  if p_modo_stock is null or p_modo_stock not in ('total', 'talla') then raise exception 'Forma de control de stock inválida'; end if;
  select * into v_producto from public.productos where ref = p_ref for update;
  if not found then raise exception 'Producto % no existe', p_ref; end if;
  v_total_actual := public.pares_de(v_producto);

  if p_modo_stock = 'total' then
    if coalesce(p_stock, -1) < 0 then raise exception 'La cantidad total debe ser cero o mayor'; end if;
    if v_producto.modo_stock = 'talla' then
      select coalesce(jsonb_object_agg(key, 0), '{}'::jsonb) into v_tallas_nuevas
        from jsonb_object_keys(v_producto.tallas) as size_keys(key);
    else
      v_tallas_nuevas := v_producto.tallas;
    end if;
    v_total_nuevo := p_stock;
    v_detalle := 'existencia total: ' || v_total_actual || ' → ' || v_total_nuevo;
    update public.productos set modo_stock = 'total', tallas = v_tallas_nuevas, stock = p_stock,
      updated_at = now() where ref = p_ref;
  elsif v_producto.modo_stock = 'talla' and nullif(btrim(p_talla), '') is not null then
    v_actual := coalesce((v_producto.tallas ->> p_talla)::int, 0);
    if coalesce(p_valor, -1) < 0 then raise exception 'La cantidad por talla debe ser cero o mayor'; end if;
    v_tallas_nuevas := jsonb_set(v_producto.tallas, array[p_talla], to_jsonb(p_valor), true);
    v_total_nuevo := v_total_actual - v_actual + p_valor;
    v_detalle := 'talla ' || p_talla || ': ' || v_actual || ' → ' || p_valor;
    update public.productos set tallas = v_tallas_nuevas, updated_at = now() where ref = p_ref;
  else
    if p_tallas is null or jsonb_typeof(p_tallas) <> 'object' or p_tallas = '{}'::jsonb then
      raise exception 'Indica el conteo real por talla';
    end if;
    if exists (select 1 from jsonb_each_text(p_tallas) e where e.key !~ '^[0-9]{1,2}$' or e.value !~ '^[0-9]+$') then
      raise exception 'Las tallas y cantidades deben ser números enteros no negativos';
    end if;
    if exists (select 1 from jsonb_each_text(p_tallas) e where e.key::int < 1 or e.key::int > 99) then
      raise exception 'Las tallas deben estar entre 1 y 99';
    end if;
    v_total_nuevo := (select coalesce(sum(value::int), 0) from jsonb_each_text(p_tallas));
    select string_agg(key || ': ' || value, ', ' order by key::int)
      into v_detalle_tallas from jsonb_each_text(p_tallas);
    if v_producto.modo_stock = 'total' then
      v_detalle := 'Cambio de control total a por talla · stock anterior ' || v_total_actual || ' · ' || v_detalle_tallas;
    else
      v_detalle := 'Conteo real por talla · stock anterior ' || v_total_actual || ' · ' || v_detalle_tallas;
    end if;
    update public.productos set modo_stock = 'talla', tallas = p_tallas, stock = 0,
      updated_at = now() where ref = p_ref;
  end if;

  insert into public.movimientos (tipo, producto_ref, modelo, detalle, quien, pares)
  values ('ajuste', p_ref, p_ref || ' · ' || v_producto.nombre,
    coalesce(nullif(btrim(p_motivo), ''), 'Conteo físico') || ' · ' || v_detalle,
    public.nombre_actual(), v_total_nuevo - v_total_actual);

  perform public.registrar_auditoria(
    'AJUSTE_INVENTARIO',
    'INVENTARIO',
    'productos',
    p_ref,
    'success',
    'info',
    jsonb_build_object(
      'modo_stock', p_modo_stock,
      'talla', p_talla,
      'valor_anterior', v_total_actual,
      'valor_nuevo', v_total_nuevo,
      'motivo', coalesce(p_motivo, 'Conteo físico')
    )
  );
end;
$$;

grant execute on function public.registrar_ajuste(text, text, jsonb, integer, text, integer, text) to authenticated;

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

  insert into public.auditoria_eventos (
    usuario_id, usuario_nombre, accion, modulo, entidad, entidad_id, resultado, severidad, metadata
  )
  values (
    auth.uid(),
    (select nombre from public.profiles where id = auth.uid()),
    'ELIMINAR_PRODUCTO',
    'INVENTARIO',
    'productos',
    p_ref,
    'success',
    'warning',
    jsonb_build_object('nombre', v_producto.nombre, 'stock_final', public.pares_de(v_producto))
  );
end;
$$;

grant execute on function public.eliminar_producto(text) to authenticated;
