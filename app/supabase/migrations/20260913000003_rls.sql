-- ============================================================
-- Row Level Security.
-- Todo lo que cambia stock (venta, entrada, ajuste, devolución,
-- archivar) pasa por las funciones SECURITY DEFINER de
-- 000002_functions.sql, así que estas tablas no necesitan políticas
-- de INSERT/UPDATE para el rol `authenticated` — sin una política
-- que lo permita, esas operaciones quedan bloqueadas por RLS y solo
-- las funciones (que corren como dueño, sin RLS) pueden hacerlas.
-- ============================================================

alter table public.profiles enable row level security;
alter table public.tipos_producto enable row level security;
alter table public.productos enable row level security;
alter table public.ventas enable row level security;
alter table public.venta_items enable row level security;
alter table public.movimientos enable row level security;
alter table public.destinatarios_correo enable row level security;
alter table public.configuracion enable row level security;
alter table public.envios_correo enable row level security;

-- ---------- profiles ----------
-- Cualquier usuario autenticado puede leer los perfiles (se necesitan
-- nombres de vendedores en ventas/movimientos). Solo un admin activo
-- puede cambiar rol/estado de alguien.
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);

create policy "profiles_update_admin" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- tipos_producto ----------
create policy "tipos_select" on public.tipos_producto
  for select to authenticated using (true);

create policy "tipos_insert_admin" on public.tipos_producto
  for insert to authenticated with check (public.is_admin());

create policy "tipos_update_admin" on public.tipos_producto
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- productos ----------
-- Catálogo visible para cualquiera autenticado (vendedor incluido).
-- Alta/edición/borrado directo del catálogo: solo admin. El stock que
-- mueven venta/entrada/ajuste/devolución pasa por las funciones.
create policy "productos_select" on public.productos
  for select to authenticated using (true);

create policy "productos_insert_admin" on public.productos
  for insert to authenticated with check (public.is_admin());

create policy "productos_update_admin" on public.productos
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "productos_delete_admin" on public.productos
  for delete to authenticated using (public.is_admin());

-- ---------- ventas / venta_items ----------
-- Un vendedor solo ve sus propias facturas; un admin las ve todas.
-- No hay política de insert/update: se hace vía registrar_venta /
-- registrar_devolucion (SECURITY DEFINER).
create policy "ventas_select" on public.ventas
  for select to authenticated using (public.is_admin() or vendedor_id = auth.uid());

create policy "venta_items_select" on public.venta_items
  for select to authenticated using (
    exists (
      select 1 from public.ventas v
      where v.id = venta_items.venta_id
        and (public.is_admin() or v.vendedor_id = auth.uid())
    )
  );

-- ---------- movimientos ----------
-- Pantalla de solo administrador.
create policy "movimientos_select_admin" on public.movimientos
  for select to authenticated using (public.is_admin());

-- ---------- correo diario ----------
create policy "destinatarios_admin" on public.destinatarios_correo
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "configuracion_select" on public.configuracion
  for select to authenticated using (true);

create policy "configuracion_update_admin" on public.configuracion
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "envios_admin" on public.envios_correo
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
