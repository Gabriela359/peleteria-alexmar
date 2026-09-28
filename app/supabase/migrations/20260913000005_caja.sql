-- ============================================================
-- Apertura y cierre de caja (corte Z).
-- Una sola caja compartida por día para todo el negocio: quien
-- llega primero la abre con el fondo inicial de efectivo, y al
-- cerrarla (corte Z) el sistema calcula lo esperado en efectivo
-- (fondo + ventas en efectivo del día, sin contar devoluciones)
-- contra lo que se contó a mano, dejando la diferencia
-- (sobrante/faltante) registrada para siempre.
-- Mientras no haya una caja abierta hoy, registrar_venta rechaza
-- la venta.
-- Ejecutar después de 000001-000004.
-- ============================================================

do $$ begin
  create type public.estado_caja as enum ('abierta', 'cerrada');
exception when duplicate_object then null; end $$;

create table if not exists public.cajas (
  id bigint generated always as identity primary key,
  fecha date not null unique,
  estado public.estado_caja not null default 'abierta',
  fondo_inicial numeric(12, 2) not null default 0,
  abierta_por uuid not null references public.profiles (id),
  abierta_por_nombre text not null,
  abierta_en timestamptz not null default now(),
  cerrada_por uuid references public.profiles (id),
  cerrada_por_nombre text,
  cerrada_en timestamptz,
  total_efectivo numeric(12, 2),
  total_transferencia numeric(12, 2),
  total_ventas numeric(12, 2),
  efectivo_esperado numeric(12, 2),
  efectivo_contado numeric(12, 2),
  diferencia numeric(12, 2)
);
create index if not exists cajas_fecha_idx on public.cajas (fecha desc);

alter table public.cajas enable row level security;

drop policy if exists "cajas_select" on public.cajas;
create policy "cajas_select" on public.cajas
  for select to authenticated using (true);
-- Sin políticas de insert/update: solo abrir_caja / cerrar_caja (SECURITY
-- DEFINER) pueden escribir, igual que ventas/movimientos/productos.

-- ---------- abrir_caja ----------
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

  return v_caja;
end;
$$;

grant execute on function public.abrir_caja(numeric) to authenticated;

-- ---------- cerrar_caja (corte Z) ----------
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

  return v_caja;
end;
$$;

grant execute on function public.cerrar_caja(numeric) to authenticated;

-- ---------- registrar_venta: ahora exige que haya caja abierta hoy ----------
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
  return v_venta_id;
end;
$$;

grant execute on function public.registrar_venta(jsonb, public.metodo_pago, text) to authenticated;
