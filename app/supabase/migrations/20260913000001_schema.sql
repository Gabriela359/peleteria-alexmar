-- ============================================================
-- Peletería El Progreso · esquema base
-- Tablas, tipos enumerados e índices. Ejecutar antes que
-- 000002_functions.sql, 000003_rls.sql y 000004_storage.sql.
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- Tipos enumerados ----------
do $$ begin
  create type public.rol_usuario as enum ('admin', 'vendedor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.unidad_venta as enum ('par', 'unidad');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.metodo_pago as enum ('Efectivo', 'Transferencia');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.movimiento_tipo as enum ('entrada', 'ajuste', 'devolucion', 'archivado', 'reactivado');
exception when duplicate_object then null; end $$;

-- ---------- profiles ----------
-- Un perfil por usuario de Supabase Auth (mismo id). Se crea solo via
-- trigger handle_new_user (ver 000002_functions.sql) cuando alguien
-- se registra / es invitado desde el dashboard de Supabase.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  correo text not null,
  rol public.rol_usuario not null default 'vendedor',
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- tipos_producto ----------
create table if not exists public.tipos_producto (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  con_talla boolean not null default false,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- productos ----------
create table if not exists public.productos (
  ref text primary key,
  nombre text not null,
  tipo text not null references public.tipos_producto (nombre) on update cascade,
  unidad public.unidad_venta not null default 'par',
  color text,
  precio numeric(12, 2) not null default 0,
  costo numeric(12, 2) not null default 0,
  min integer not null default 0,
  tallas jsonb not null default '{}'::jsonb, -- { "38": 24, "39": 30, ... } (solo si unidad = 'par')
  stock integer not null default 0,          -- unidades sueltas (solo si unidad = 'unidad')
  foto_url text,
  archivado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists productos_tipo_idx on public.productos (tipo);
create index if not exists productos_archivado_idx on public.productos (archivado);

-- ---------- ventas ----------
create sequence if not exists public.venta_id_seq start 1001;

create table if not exists public.ventas (
  id text primary key,
  fecha timestamptz not null default now(),
  vendedor_id uuid not null references public.profiles (id),
  vendedor_nombre text not null,
  metodo public.metodo_pago not null,
  cliente text,
  total numeric(12, 2) not null default 0,
  costo numeric(12, 2) not null default 0,
  devuelta boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists ventas_fecha_idx on public.ventas (fecha);
create index if not exists ventas_vendedor_idx on public.ventas (vendedor_id);

create table if not exists public.venta_items (
  id bigint generated always as identity primary key,
  venta_id text not null references public.ventas (id) on delete cascade,
  ref text not null references public.productos (ref),
  nombre text not null,
  talla text,
  unidad public.unidad_venta not null,
  pares integer not null,
  precio numeric(12, 2) not null,
  costo numeric(12, 2) not null
);
create index if not exists venta_items_venta_idx on public.venta_items (venta_id);
create index if not exists venta_items_ref_idx on public.venta_items (ref);

-- ---------- movimientos ----------
create table if not exists public.movimientos (
  id bigint generated always as identity primary key,
  fecha timestamptz not null default now(),
  tipo public.movimiento_tipo not null,
  producto_ref text references public.productos (ref),
  modelo text not null,   -- snapshot "REF · Nombre"
  detalle text not null,
  quien text not null,
  pares integer not null default 0
);
create index if not exists movimientos_fecha_idx on public.movimientos (fecha desc);

-- ---------- correo diario ----------
create table if not exists public.destinatarios_correo (
  id bigint generated always as identity primary key,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.configuracion (
  id integer primary key default 1 check (id = 1),
  hora_envio text not null default '19:00'
);
insert into public.configuracion (id, hora_envio) values (1, '19:00')
  on conflict (id) do nothing;

create table if not exists public.envios_correo (
  id bigint generated always as identity primary key,
  fecha date not null default current_date,
  total numeric(12, 2) not null,
  pares integer not null,
  destinatarios text[] not null default '{}'::text[],
  storage_path text
);
