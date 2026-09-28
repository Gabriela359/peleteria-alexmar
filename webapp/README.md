# Peletería El Progreso · Inventario y Ventas

App web de inventario y ventas para una peletería (venta de suelas, plantillas
y demás insumos de zapatería), implementada a partir del prototipo diseñado
en Claude Design (`project/Peleteria - Inventario y Ventas.dc.html`).

## Stack

- React 19 + Vite, JavaScript plano (sin TypeScript).
- Sin backend: los datos (catálogo, ventas, movimientos, usuarios) viven en
  `localStorage` del navegador, así que persisten entre recargas de un mismo
  dispositivo/navegador. El correo diario y la factura son una **vista previa
  fiel** del envío/impresión (no hay servidor de correo ni impresora real
  conectada) — export CSV y la tirilla POS sí son reales (descarga/impresión
  del navegador).
- Diseño: tokens y tipografía "Sura Sans" tomados de `_ds/.../tokens.css`
  (sistema de diseño Sura Evoluciona) para mantener fidelidad visual con el
  prototipo.

## Desarrollo

```bash
npm install
npm run dev       # servidor de desarrollo
npm run build     # build de producción a dist/
npm run lint      # oxlint
```

## Estructura

```
src/
  lib/format.js       formato de moneda/fecha, agregados de reportes, paginación
  lib/seed.js         catálogo y datos de demostración iniciales
  state/store.jsx      estado global de la app (contexto + persistencia)
  screens/            una pantalla por ruta (Panel, Venta, Inventario, …)
  components/          Header, Toast, iconos, modales, primitivas de UI
  styles/              tokens.css (del sistema de diseño) + app.css
```

## Roles

- **Administrador** (Ana Márquez): panel, ventas, inventario (CRUD +
  archivar), movimientos, reportes completos, usuarios, correo diario.
- **Vendedor** (Carlos Rueda): registrar ventas, consultar inventario, ver
  sus propias ventas.

Al entrar se elige el perfil desde la pantalla de ingreso (no hay
autenticación real: es un mismo navegador/dispositivo compartido en el
local).
