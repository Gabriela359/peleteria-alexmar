-- ============================================================
-- Auditoría de negocio.
-- Registra eventos críticos de operación para venta, caja,
-- inventario, usuarios y reportes. Todo queda en PostgreSQL,
-- no depende del navegador ni de la UI.
-- ============================================================

create table if not exists public.auditoria_eventos (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  usuario_id uuid references public.profiles (id) on delete set null,
  usuario_nombre text,
  accion text not null,
  modulo text not null,
  entidad text,
  entidad_id text,
  resultado text not null default 'success' check (resultado in ('success', 'failed', 'rejected')),
  severidad text not null default 'info' check (severidad in ('info', 'warning', 'error')),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists auditoria_eventos_fecha_idx on public.auditoria_eventos (created_at desc);
create index if not exists auditoria_eventos_accion_idx on public.auditoria_eventos (accion);
create index if not exists auditoria_eventos_modulo_idx on public.auditoria_eventos (modulo);

alter table public.auditoria_eventos enable row level security;

create or replace function public.registrar_auditoria(
  p_accion text,
  p_modulo text,
  p_entidad text default null,
  p_entidad_id text default null,
  p_resultado text default 'success',
  p_severidad text default 'info',
  p_metadata jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
begin
  if coalesce(trim(p_accion), '') = '' then
    raise exception 'La acción de auditoría es obligatoria';
  end if;

  if coalesce(trim(p_modulo), '') = '' then
    raise exception 'El módulo de auditoría es obligatorio';
  end if;

  insert into public.auditoria_eventos (
    usuario_id,
    usuario_nombre,
    accion,
    modulo,
    entidad,
    entidad_id,
    resultado,
    severidad,
    metadata
  )
  values (
    auth.uid(),
    (select nombre from public.profiles where id = auth.uid()),
    p_accion,
    p_modulo,
    p_entidad,
    p_entidad_id,
    case when p_resultado in ('success', 'failed', 'rejected') then p_resultado else 'success' end,
    case when p_severidad in ('info', 'warning', 'error') then p_severidad else 'info' end,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.registrar_auditoria(
  text,
  text,
  text,
  text,
  text,
  text,
  jsonb
) to authenticated;

create policy "auditoria_select_admin"
on public.auditoria_eventos
for select
to authenticated
using (public.is_admin());

-- ---------- auditoría de registro de usuario ----------
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

  perform public.registrar_auditoria(
    'CREAR_USUARIO',
    'USUARIOS',
    'profiles',
    new.id::text,
    'success',
    'info',
    jsonb_build_object(
      'correo', new.email,
      'nombre', coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1))
    )
  );

  return new;
end;
$$;

-- ---------- venta ----------
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

-- ---------- devolución ----------
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

-- ---------- entrada de inventario ----------
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

  perform public.registrar_auditoria(
    'ENTRADA_INVENTARIO',
    'INVENTARIO',
    'productos',
    p_ref,
    'success',
    'info',
    jsonb_build_object(
      'proveedor', coalesce(nullif(trim(p_proveedor), ''), 'Proveedor sin nombre'),
      'cantidad', v_total,
      'unidad', v_producto.unidad
    )
  );
end;
$$;

grant execute on function public.registrar_entrada(text, jsonb, text) to authenticated;

-- ---------- ajuste de inventario ----------
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

  perform public.registrar_auditoria(
    'AJUSTE_INVENTARIO',
    'INVENTARIO',
    'productos',
    p_ref,
    'success',
    'info',
    jsonb_build_object(
      'talla', p_talla,
      'valor_anterior', v_actual,
      'valor_nuevo', p_valor,
      'motivo', coalesce(p_motivo, 'Conteo físico')
    )
  );
end;
$$;

grant execute on function public.registrar_ajuste(text, text, integer, text) to authenticated;

-- ---------- cierre y apertura de caja ----------
create or replace function public.abrir_caja(p_fondo_inicial numeric default 0)
returns public.cajas
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caja public.cajas;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and activo) then
    raise exception 'Usuario no válido o inactivo';
  end if;
  if p_fondo_inicial is null or p_fondo_inicial < 0 then
    raise exception 'El fondo inicial no puede ser negativo';
  end if;

  select * into v_caja from public.cajas where fecha = current_date;
  if found then
    if v_caja.estado = 'abierta' then
      raise exception 'La caja de hoy ya está abierta';
    else
      raise exception 'La caja de hoy ya fue cerrada con su corte Z';
    end if;
  end if;

  insert into public.cajas (fecha, estado, fondo_inicial, abierta_por, abierta_por_nombre, abierta_en)
  values (current_date, 'abierta', p_fondo_inicial, auth.uid(), public.nombre_actual(), now())
  returning * into v_caja;

  perform public.registrar_auditoria(
    'ABRIR_CAJA',
    'CAJA',
    'cajas',
    v_caja.id::text,
    'success',
    'info',
    jsonb_build_object(
      'fondo_inicial', p_fondo_inicial,
      'fecha', current_date
    )
  );

  return v_caja;
end;
$$;

grant execute on function public.abrir_caja(numeric) to authenticated;

create or replace function public.cerrar_caja(p_efectivo_contado numeric)
returns public.cajas
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caja public.cajas;
  v_efectivo numeric(12, 2);
  v_transferencia numeric(12, 2);
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and activo) then
    raise exception 'Usuario no válido o inactivo';
  end if;
  if p_efectivo_contado is null or p_efectivo_contado < 0 then
    raise exception 'El efectivo contado no puede ser negativo';
  end if;

  select * into v_caja from public.cajas where fecha = current_date for update;
  if not found then raise exception 'No hay una caja abierta hoy'; end if;
  if v_caja.estado = 'cerrada' then raise exception 'La caja de hoy ya fue cerrada'; end if;

  select
    coalesce(sum(total) filter (where metodo = 'Efectivo'), 0),
    coalesce(sum(total) filter (where metodo = 'Transferencia'), 0)
  into v_efectivo, v_transferencia
  from public.ventas
  where fecha::date = v_caja.fecha and not devuelta;

  update public.cajas set
    estado = 'cerrada',
    cerrada_por = auth.uid(),
    cerrada_por_nombre = public.nombre_actual(),
    cerrada_en = now(),
    total_efectivo = v_efectivo,
    total_transferencia = v_transferencia,
    total_ventas = v_efectivo + v_transferencia,
    efectivo_esperado = v_caja.fondo_inicial + v_efectivo,
    efectivo_contado = p_efectivo_contado,
    diferencia = p_efectivo_contado - (v_caja.fondo_inicial + v_efectivo)
  where id = v_caja.id
  returning * into v_caja;

  perform public.registrar_auditoria(
    'CERRAR_CAJA',
    'CAJA',
    'cajas',
    v_caja.id::text,
    'success',
    'info',
    jsonb_build_object(
      'efectivo_esperado', v_caja.efectivo_esperado,
      'efectivo_contado', p_efectivo_contado,
      'diferencia', v_caja.diferencia,
      'total_ventas', v_caja.total_ventas
    )
  );

  return v_caja;
end;
$$;

grant execute on function public.cerrar_caja(numeric) to authenticated;

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

  perform public.registrar_auditoria(
    case when p_archivado then 'ARCHIVAR_PRODUCTO' else 'REACTIVAR_PRODUCTO' end,
    'INVENTARIO',
    'productos',
    p_ref,
    'success',
    'info',
    jsonb_build_object(
      'archivado', p_archivado,
      'cantidad_actual', public.pares_de(v_producto)
    )
  );
end;
$$;

grant execute on function public.archivar_producto(text, boolean) to authenticated;

-- ---------- políticas de lectura a la auditoría ----------
-- Solo admin puede leer esto. Los vendedores no deben entrever el detalle de
-- eventos críticos del negocio. La auditoría existe para trazabilidad, no para UX.
create policy "auditoria_admin_read"
on public.auditoria_eventos
for select
to authenticated
using (public.is_admin());
