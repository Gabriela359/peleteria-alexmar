-- Keep historical sales when a user is permanently removed.
alter table public.ventas
  alter column vendedor_id drop not null;

alter table public.ventas
  drop constraint if exists ventas_vendedor_id_fkey;

alter table public.ventas
  add constraint ventas_vendedor_id_fkey
  foreign key (vendedor_id) references public.profiles (id) on delete set null;
