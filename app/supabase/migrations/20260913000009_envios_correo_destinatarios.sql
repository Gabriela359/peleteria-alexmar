-- Add report fields for projects where envios_correo predates the current schema.
alter table public.envios_correo
  add column if not exists destinatarios text[] not null default '{}'::text[];

alter table public.envios_correo
  add column if not exists storage_path text;

notify pgrst, 'reload schema';
