-- Use the business timezone for current_date inside the caja RPCs.
-- This keeps caja dates aligned with the app's America/Bogota operating day.
alter function public.abrir_caja(numeric)
  set timezone to 'America/Bogota';

alter function public.cerrar_caja(numeric)
  set timezone to 'America/Bogota';

alter function public.registrar_venta(jsonb, public.metodo_pago, text)
  set timezone to 'America/Bogota';