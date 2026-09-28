-- ============================================================
-- Supabase Storage: buckets y políticas.
-- - "productos": fotos de catálogo. Público de lectura (se muestran
--   directo por URL en la app), solo admin puede subir/editar/borrar.
-- - "reportes": snapshot del cierre diario que arma la pantalla de
--   Correo diario al presionar "Enviar ahora". Privado, solo admin.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('reportes', 'reportes', false)
on conflict (id) do nothing;

create policy "productos_fotos_select" on storage.objects
  for select using (bucket_id = 'productos');

create policy "productos_fotos_admin_write" on storage.objects
  for insert to authenticated with check (bucket_id = 'productos' and public.is_admin());

create policy "productos_fotos_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'productos' and public.is_admin())
  with check (bucket_id = 'productos' and public.is_admin());

create policy "productos_fotos_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'productos' and public.is_admin());

create policy "reportes_admin_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'reportes' and public.is_admin())
  with check (bucket_id = 'reportes' and public.is_admin());
