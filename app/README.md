# Peletería El Progreso · Inventario y Ventas

Sistema de inventario y ventas para una peletería (venta de suelas, plantillas
y demás insumos de zapatería), con dos roles — **vendedor** (registra ventas
y consulta inventario) y **administrador** (todos los módulos, incluyendo
inventario, movimientos, reportes, usuarios y descarga de reportes en PDF).

**Stack:** React + TypeScript + Vite + Tailwind CSS · Supabase (Postgres +
Auth + Storage).

> Este proyecto reemplaza una primera versión frontend-only (en `../webapp`,
> con datos en `localStorage`) por esta, con backend real en Supabase.

## 1 · Crea el proyecto de Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com/dashboard) (o usa uno existente).
2. En **Project Settings → API** copia la **Project URL** y la **anon public key**.
3. En **Authentication → Providers**, deja habilitado *Email*. Recomendado:
   apaga **"Allow new users to sign up"** (Authentication → Settings) — los
   usuarios de este sistema los crea un administrador (paso 4), no se
   registran solos.

## 2 · Aplica el esquema de base de datos

Abre **SQL Editor** en el dashboard de Supabase y ejecuta, **en este orden**,
el contenido de cada archivo (o usa la CLI de Supabase, ver más abajo):

1. `supabase/migrations/20260913000001_schema.sql` — tablas, enums, índices.
2. `supabase/migrations/20260913000002_functions.sql` — funciones de negocio
   (`registrar_venta`, `registrar_entrada`, `registrar_ajuste`,
   `registrar_devolucion`, `archivar_producto`) y el
   trigger que crea el perfil de cada usuario nuevo.
3. `supabase/migrations/20260913000003_rls.sql` — Row Level Security.
4. `supabase/migrations/20260913000004_storage.sql` — buckets de Storage
   (`productos`, público, fotos de catálogo; `reportes`, privado, usado por
   compatibilidad con snapshots anteriores) y sus políticas.
5. `supabase/migrations/20260913000005_caja.sql` — apertura, cierre y ventas
  condicionadas a caja abierta.
6. `supabase/migrations/20260913000006_auditoria.sql` — auditoría de ventas,
  caja, inventario, usuarios y reportes.
7. `supabase/migrations/20260913000007_timezone_caja.sql` — alinea la fecha
  operativa de las funciones de caja con `America/Bogota`.
8. `supabase/migrations/20260913000008_user_deletion.sql` — permite eliminar
   usuarios sin borrar sus ventas históricas.
9. `supabase/migrations/20260913000009_envios_correo_destinatarios.sql` —
   conserva compatibilidad con instalaciones anteriores; la descarga de PDF
   no usa destinatarios ni registra envíos.
10. `supabase/migrations/20260913000010_inventario_por_talla.sql` — elimina
    los tipos de producto y la columna de fotos, incorpora control de stock total o por talla y
    actualiza ventas, entradas, conteos, movimientos y eliminación de
    productos. Storage no permite borrar objetos con SQL: después de aplicar
    la migración, elimina los objetos existentes y el bucket `productos`
    desde **Storage** en el dashboard de Supabase.
11. `supabase/migrations/20260913000011_fix_eliminar_producto_auditoria.sql`
    — corrige la firma de la función de eliminación.
12. `supabase/migrations/20260913000012_fix_eliminar_producto_sin_auditoria.sql`
    — elimina la dependencia de la tabla opcional `auditoria_eventos`.
13. `supabase/migrations/20260913000013_fix_archivar_producto_movimiento_tipo.sql`
    — convierte explícitamente el tipo de movimiento al enum de PostgreSQL.
14. `supabase/migrations/20260913000014_retencion_reportes_90_dias.sql`
    — limita los reportes PDF a los últimos 90 días y programa la eliminación
    diaria y permanente de facturas y cortes Z vencidos. Requiere que la
    extensión `pg_cron` esté disponible en Supabase; al aplicarla, borra
    inmediatamente los registros con más de 90 días y configura la purga a
    las 03:15 (hora de la base de datos).
15. `supabase/seed.sql` — catálogo de ejemplo (16
   productos, igual que el prototipo). **Esta app no siembra ventas ni
   movimientos falsos** — a diferencia del prototipo de demostración, aquí
   el historial se construye solo con el uso real.

Con la [CLI de Supabase](https://supabase.com/docs/guides/local-development/cli/getting-started)
ya instalada y el proyecto enlazado (`supabase link --project-ref TU-REF`),
las migraciones se aplican con:

```bash
supabase db push
```

y el seed con:

```bash
psql "$(supabase db url --db-url)" -f supabase/seed.sql
# o pega el contenido de supabase/seed.sql en el SQL Editor del dashboard
```

## 3 · Variables de entorno

```bash
cp .env.example .env.local
```

y completa las variables indicadas en `.env.example`. La descarga del PDF no
utiliza SMTP ni credenciales de correo.

## 4 · Crea tu primer administrador

No hay registro público. El primer administrador se crea una sola vez desde
Supabase y, después, los administradores pueden dar de alta cuentas desde
**Usuarios y roles**:

1. **Authentication → Users → Add user** en el dashboard de Supabase, con su
   correo y contraseña. Esto dispara el trigger `handle_new_user` y crea su
   fila en `profiles` con rol `vendedor` por defecto.
2. Promuévelo a administrador desde el **SQL Editor**:
   ```sql
   update public.profiles set rol = 'admin' where correo = 'tu@correo.com';
   ```
3. En la aplicación, abre **Usuarios y roles → Registrar usuario**. Ingresa
   nombre, correo, contraseña inicial y rol. La cuenta se crea en Supabase
   Auth y su perfil queda guardado en `profiles`. La contraseña inicial debe
   compartirse con el usuario por un canal seguro.

La creación de usuarios usa el servidor Node y la llave secreta de Supabase.
Configura `SUPABASE_SECRET_KEY` (llave `sb_secret_` de Project Settings →
API Keys) en el `.env.local` del servidor; para proyectos antiguos también
se acepta `SUPABASE_SERVICE_ROLE_KEY`. El Project ID y la llave pública
`sb_publishable_` no sustituyen esta llave. No uses el prefijo `VITE_` ni
expongas la llave secreta en el frontend. Ejecuta `npm run server` además de
`npm run dev`. El servidor comprueba la sesión y el rol de administrador antes
de crear cada cuenta.

## 5 · Instala y corre

```bash
npm install
npm run dev       # servidor de desarrollo
npm run build     # build de producción (tsc -b && vite build)
npm run lint      # oxlint
```

## Notas de diseño

- El stock de los productos puede controlarse como cantidad total o por talla.
  Las ventas solicitan una talla solo para los productos con existencias
  desglosadas por talla.
- **Reportes**: permite elegir una fecha para revisar los productos vendidos
  con cantidad, total y existencias actuales, y descargar el PDF. Solo permite
  fechas entre hoy y 90 días atrás; las facturas y los cortes Z vencen y se
  eliminan permanentemente después de 90 días. El PDF muestra solo la tarjeta
  del total vendido y debajo el detalle de productos e inventario, sin tarjetas
  resumen de pares o inventario. El endpoint autenticado `POST /reports/pdf`
  del servidor Node genera el PDF y solo permite la descarga a administradores
  activos. Hay que desplegar la versión actual del backend para que incluya la
  tabla; la aplicación detecta si el servidor todavía responde con una plantilla
  antigua. El servidor también debe estar disponible junto con la aplicación;
  `VITE_EMAIL_API_URL` configura su dirección (por defecto
  `http://localhost:3001`). Aunque el nombre de esta variable conserva "EMAIL"
  por compatibilidad, apunta al backend general.
- **Usuarios**: las cuentas se crean con Supabase Auth desde el endpoint
  `/users` del servidor y el trigger de base de datos crea el perfil inicial.
  El servidor asigna el rol solicitado y revierte la cuenta Auth si no logra
  guardar el perfil. La eliminación permanente borra la cuenta Auth y su
  perfil; las ventas históricas se conservan con el nombre registrado en la
  factura y sin asociarse a una cuenta activa. Para esta opción se requiere
  aplicar `20260913000008_user_deletion.sql`.
- Todas las mutaciones que tocan stock (venta, entrada, ajuste, devolución,
  archivar) pasan por funciones de Postgres `SECURITY DEFINER` que validan el
  rol del usuario y dejan el movimiento registrado — no hay lógica de negocio
  sensible solo en el cliente.
- `src/types/database.ts` está escrito a mano (no hay proyecto Supabase real
  contra el cual correr `supabase gen types`). El cliente de Supabase
  (`src/lib/supabase.ts`) se crea **sin** el genérico `<Database>`: la versión
  instalada de `supabase-js` exige una forma muy particular (no documentada)
  para ese genérico, y sin un proyecto real para generar los tipos oficiales
  no vale la pena pelear con eso a mano. Cada hook en `src/hooks/*.ts` anota a
  mano el tipo de retorno de sus queries, así que la app sigue tipada de
  extremo a extremo; cuando tengas un proyecto real corre:
  ```bash
  npx supabase gen types typescript --project-id TU-PROYECTO > src/types/database.generated.ts
  ```
  y pasa ese tipo generado como `<Database>` a `createClient` para recuperar
  el tipado estricto del builder de queries.

## 6 · Checklist final antes de producción

Antes de poner la app en vivo, sigue esta checklist de despliegue y validación.

### 6.1 · Base de datos y migraciones

- [ ] Ejecutar en Supabase y en orden las migraciones:
  - `20260913000001_schema.sql`
  - `20260913000002_functions.sql`
  - `20260913000003_rls.sql`
  - `20260913000004_storage.sql`
  - `20260913000005_caja.sql`
  - `20260913000006_auditoria.sql`
  - `20260913000007_timezone_caja.sql`
  - `20260913000008_user_deletion.sql`
  - `20260913000009_envios_correo_destinatarios.sql` (compatibilidad con instalaciones anteriores)
  - `20260913000010_inventario_por_talla.sql` y las correcciones `20260913000011` a `20260913000013`
  - `20260913000014_retencion_reportes_90_dias.sql` (requiere `pg_cron` disponible)
- [ ] Confirmar que existen los enums: `rol_usuario`, `unidad_venta`,
  `metodo_pago`, `movimiento_tipo`, `estado_caja`.
- [ ] Revisar que no haya funciones duplicadas ni triggers repetidos.
- [ ] Verificar que `registrar_venta` y `cerrar_caja` se creen con la última
  versión del negocio (pares vs unidades, caja abierta, límite de stock).

### 6.2 · Seguridad y permisos

- [ ] Revisar RLS y políticas de acceso para usuarios autenticados.
- [ ] Asegurarse de que solo perfiles activos puedan operar ventas.
- [ ] Verificar que `SECURITY DEFINER` se use solo en funciones críticas.
- [ ] Confirmar que las tablas `ventas`, `producto`, `movimientos`, `cajas`
  no permitan escritura directa a usuarios no autorizados.
- [ ] Probar que una venta sin caja abierta falle correctamente.

### 6.3 · Autenticación y usuarios

- [ ] Activar Auth en Supabase con email.
- [ ] Crear al menos un usuario admin real.
- [ ] Verificar que `handle_new_user` cree la fila en `profiles`.
- [ ] Confirmar que el rol inicial sea `vendedor` y se promueva a `admin` por SQL o desde la app.
- [ ] Probar login/logout con un usuario real.

### 6.4 · Variables de entorno

- [ ] Definir `VITE_SUPABASE_URL`.
- [ ] Definir `VITE_SUPABASE_ANON_KEY`.
- [ ] Revisar que la app no use claves secretas en el frontend.
- [ ] Confirmar que el dominio de producción esté permitido en Supabase Auth.
- [ ] Configurar `VITE_EMAIL_API_URL` con la dirección del backend y comprobar
  que el servidor pueda acceder a Supabase.
- [ ] En el backend, definir `SUPABASE_URL` y `SUPABASE_ANON_KEY`. Definir
  `SUPABASE_SECRET_KEY` solo si se registran usuarios desde la aplicación.
- [ ] No hace falta configurar `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`,
  `EMAIL_PASS` ni otras credenciales de correo para descargar reportes PDF.

### 6.5 · Datos iniciales

- [ ] Cargar stock inicial real, en cantidad total o por talla.
- [ ] Revisar tallas y stock por producto.
- [ ] Probar ventas con stock total y con stock por talla.

### 6.6 · Caja, ventas y devoluciones

- [ ] Abrir la caja del día antes de vender.
- [ ] Probar venta en efectivo.
- [ ] Probar venta en transferencia.
- [ ] Probar venta mixta de productos por pares y unidades.
- [ ] Verificar que la regla de negocio no mezcle pares y unidades.
- [ ] Probar venta con stock insuficiente para que falle correctamente.
- [ ] Probar devolución de factura por admin.
- [ ] Verificar que el stock vuelva a sumarse correctamente tras la devolución.
- [ ] Ejecutar corte Z y revisar la diferencia final.

### 6.7 · Inventario y movimientos

- [ ] Confirmar que los ajustes de stock registren movimientos.
- [ ] Probar entrada de inventario.
- [ ] Probar ajuste manual.
- [ ] Revisar que `movimientos` quede consistente con ventas, entradas y devoluciones.

### 6.8 · Reportes y facturas

- [ ] Validar que la pantalla de reportes muestre facturas y caja con formato limpio.
- [ ] Probar exportación CSV.
- [ ] Revisar visualización de detalle de factura.
- [ ] Descargar el reporte diario en PDF para hoy y para una fecha anterior.
- [ ] Revisar que el PDF incluya el inventario completo en una o varias páginas.

### 6.9 · Pruebas finales antes de go-live

- [ ] Ejecutar `npm test`.
- [ ] Ejecutar `npm run build`.
- [ ] Probar login real.
- [ ] Probar venta real.
- [ ] Probar devolución real.
- [ ] Probar cierre de caja real.
- [ ] Confirmar que los datos sean consistentes en Supabase.

### 6.10 · Recomendación final

Se recomienda hacer la salida a producción solo después de una prueba real de
flujo completo del negocio en un entorno de prueba: crear usuario → iniciar
sesión → abrir caja → vender → revisar factura → devolver → cerrar caja.

## Qué no se pudo probar en este entorno

Este build se hizo en un sandbox sin Docker ni acceso a un proyecto Supabase
real, así que **no se pudo ejecutar el SQL contra una base de datos de
verdad** ni probar el flujo de auth/RLS de punta a punta. Sí se
verificó: `tsc -b` sin errores, `vite build` de producción sin errores, y
render visual de todas las pantallas y modales (con datos vacíos, sin
backend). Antes de usarlo en producción, aplica las migraciones en un
proyecto de prueba y recorre al menos una vez el flujo completo: crear
usuario → iniciar sesión → crear productos con stock total y por talla →
vender en ambos modos → ver factura →
reportes → devolución → descargar reporte diario.
