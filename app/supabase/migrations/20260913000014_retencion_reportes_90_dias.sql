create or replace function public.purgar_historial_vencido()
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
set timezone = 'America/Bogota'
as $$
begin
  delete from public.ventas
  where fecha < ((current_date - 90)::timestamp at time zone 'America/Bogota');

  delete from public.cajas
  where fecha < current_date - 90;
end;
$$;

revoke all on function public.purgar_historial_vencido() from public, anon, authenticated;

create extension if not exists pg_cron;

select public.purgar_historial_vencido();

select cron.unschedule(jobid)
from cron.job
where jobname = 'purge-expired-sales-and-cash-history';

select cron.schedule(
  'purge-expired-sales-and-cash-history',
  '15 3 * * *',
  'select public.purgar_historial_vencido();'
);
