# Peletería El Progreso · Inventario y Ventas

Sistema de inventario y ventas para una peletería (venta de suelas, plantillas
y demás insumos de zapatería), con dos roles — **vendedor** (registra ventas,
consulta inventario) y **administrador** (todo lo anterior + CRUD de
inventario, movimientos, reportes, usuarios y correo diario).

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
   `registrar_devolucion`, `archivar_producto`, `ocultar_tipo_producto`) y el
   trigger que crea el perfil de cada usuario nuevo.
3. `supabase/migrations/20260913000003_rls.sql` — Row Level Security.
4. `supabase/migrations/20260913000004_storage.sql` — buckets de Storage
   (`productos`, público, fotos de catálogo; `reportes`, privado, snapshot
   del cierre diario) y sus políticas.
5. `supabase/migrations/20260913000005_caja.sql` — apertura, cierre y ventas
  condicionadas a caja abierta.
6. `supabase/migrations/20260913000006_auditoria.sql` — auditoría de ventas,
  caja, inventario, usuarios y reportes.
7. `supabase/migrations/20260913000007_timezone_caja.sql` — alinea la fecha
  operativa de las funciones de caja con `America/Bogota`.
8. `supabase/seed.sql` — tipos de producto + catálogo de ejemplo (16
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

y completa `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` con los datos del
paso 1.

## 4 · Crea tu primer administrador

Esta app no tiene un formulario de registro (por diseño: los usuarios los da
de alta un administrador). Para el primero:

1. **Authentication → Users → Add user** en el dashboard de Supabase, con su
   correo y contraseña. Esto dispara el trigger `handle_new_user` y crea su
   fila en `profiles` con rol `vendedor` por defecto.
2. Promuévelo a administrador desde el **SQL Editor**:
   ```sql
   update public.profiles set rol = 'admin' where correo = 'tu@correo.com';
   ```
3. Los siguientes usuarios los puedes seguir creando igual desde
   Authentication → Add user, y cambiarles el rol desde la pantalla
   **Usuarios y roles** de la propia app (ya con un admin activo) o por SQL.

## 5 · Instala y corre

```bash
npm install
npm run dev       # servidor de desarrollo
npm run build     # build de producción (tsc -b && vite build)
npm run lint      # oxlint
```

## Notas de diseño

- **Fotos de producto** se suben a Storage (`bucket productos`, público) desde
  el formulario de Nuevo/Actualizar producto.
- **Correo diario**: "Ver y enviar prueba" arma la vista previa con datos
  reales de Supabase y, al presionar "Enviar ahora", sube un snapshot JSON del
  cierre a Storage (`bucket reportes`, privado), deja constancia en
  `envios_correo` y también dispara un servicio del backend por SMTP con
  Nodemailer. El destinatario por defecto es `gabrielaempresa572@gmail.com`,
  y se puede sobreescribir por lista dinámica del panel. Para habilitarlo real,
  completa `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` y
  `EMAIL_FROM` en `.env.local` y levanta el servidor con `npm run server`.
- **Tipos de producto**: "eliminar" un tipo en realidad lo oculta
  (`tipos_producto.activo = false`); si algún producto todavía lo usa, se
  bloquea (mismo comportamiento que el prototipo).
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
- [ ] Si se usa correo real, completar `EMAIL_HOST`, `EMAIL_PORT`,
  `EMAIL_USER`, `EMAIL_PASS` y `EMAIL_FROM` en `.env.local`.

### 6.5 · Datos iniciales

- [ ] Crear tipos de producto base.
- [ ] Cargar stock inicial real de pares y unidades.
- [ ] Revisar tallas y stock por producto.
- [ ] Crear al menos 1 producto por `par` y 1 por `unidad`.
- [ ] Probar la venta de cada tipo para confirmar que los cálculos son correctos.

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

### 6.8 · Reportes, facturas y correo

- [ ] Validar que la pantalla de reportes muestre facturas y caja con formato limpio.
- [ ] Probar exportación CSV.
- [ ] Revisar visualización de detalle de factura.
- [ ] Probar correo diario con un envío real de prueba.
- [ ] Verificar que el snapshot se suba al bucket `reportes` y quede en `envios_correo`.

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
verdad** ni probar el flujo de auth/RLS/Storage de punta a punta. Sí se
verificó: `tsc -b` sin errores, `vite build` de producción sin errores, y
render visual de todas las pantallas y modales (con datos vacíos, sin
backend). Antes de usarlo en producción, aplica las migraciones en un
proyecto de prueba y recorre al menos una vez el flujo completo: crear
usuario → iniciar sesión → crear producto (con foto) → vender → ver factura →
reportes → devolución → correo diario.
