---
name: Evoluciona Admin Design System
description: Sistema de diseño consolidado para herramientas internas SURA Evoluciona — Portal de Agentes, Cobranza, Claims, Underwriting, Ops. Hereda los tokens, voz y firma visual de Sura Evoluciona (sub-tema Tool) y absorbe los patrones de tabla densa, identificadores monoespaciados y marcadores de prototipado del proyecto Cobranza. Solo admin/tools — el sub-tema Brand queda fuera del scope. Usa este skill cuando el ask sea una pantalla operativa: bandejas, listings CRUD, dashboards de ops, master-detail, wizards multi-paso, formularios de back-office, tablas densas con filtros, modales de confirmación. Lenguaje español (MX) informal "tú".
---

# Evoluciona Admin Design System

Sistema consolidado para herramientas internas SURA México. Una sola fuente de verdad — sin sub-temas Brand, sin paletas alternativas, sin tipografía adicional.

## Cómo usarlo

1. **Lee `README.md`** para tokens, fundación visual y vocabulario.
2. **Lee `design-rules.md`** para "cuándo usar qué y por qué" — las decisiones específicas del proyecto. Si tu pantalla cae en una situación catalogada, replica.
3. **Importa los CSS:**
   ```html
   <link rel="stylesheet" href="<path>/tokens.css">
   <link rel="stylesheet" href="<path>/components.css">
   ```
   `tokens.css` declara variables CSS y mapea elementos base (h1-h4, body, focus). `components.css` provee todas las clases componentizables (botones, inputs, tabla, cards, modal, etc.).
4. **Para iconos**, usa el helper en `icons.js`:
   ```html
   <script src="<path>/icons.js"></script>
   <i data-icon="alert-triangle" data-size="22"></i>
   ```
   El script reemplaza placeholders con SVG inline (`stroke="currentColor"`). Tamaños permitidos: 14 / 16 / 18 / 20 / 22 / 24 / 32. Set en `assets/icons/`.
5. **Para ver todo el sistema en una página**, abre `Mood Board.html` (la tabla tiene un panel de Tweaks).
6. **Para un ejemplo end-to-end de CRUD admin**, abre `CRUD Example.html`.

## Decisiones fundacionales (zanjadas — no se discuten dentro de una pantalla)

| Decisión | Valor | Por qué |
|---|---|---|
| **Color primario interacción** | `--sura-azul-cielo` `#2D6DF6` | Marca Evoluciona. CTAs primarios, **headers de app, footers**, links, focus, selección. |
| **CTA principal de la pantalla** | `--sura-amarillo` `#E3E829` | La acción más importante de la pantalla — una sola por surface. No "final del proceso": también aplica a *Guardar póliza*, *Crear endoso*, *Confirmar pago*, *Liberar*. |
| **Color secundario** | `--sura-azul-prof` `#0033A0` | Sub-títulos (H2), section titles uppercase, botones secondary outline, estados info, marca dentro de doc-card. |
| **Azul oscuro** | `--sura-azul-oscuro` `#00003F` | Solo superficies dark puntuales: doc-card head, ref-block. |
| **Radio de botones** | `999px` (pill) siempre | Firma visual. Aplica también en tablas y toolbars. |
| **Radio de inputs** | `12px 12px 0 0` (top-only) | Firma visual. Aplica también en filtros, search, date-picker. |
| **Radio de cards** | `16px` | Densidad admin. Modales a `20px`. doc-card body a `12px`. |
| **Ancho de página admin** | Full-width con padding lateral 32px | Pantallas admin tienen mucho contenido en el fold (tablas anchas, master-detail, dashboards). No las encajonemos a 1440. Solo docs/mood-board usan `--max-readable: 1440px`. |
| **Escala de espaciado** | 4-pt (4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64) | Las herramientas operativas requieren densidades intermedias. |
| **Familia tipográfica** | Sura Sans (400/600/700) + SF Mono | Marca + mono para identificadores. |
| **H1 de página** | 24px, `--fg-1` `#0D0D0D` neutro | Los colores se reservan para acciones; el azul institucional vive en sub-títulos (H2) y section titles uppercase. |
| **H2 · subtítulo** | 20px, `--sura-azul-prof` `#0033A0` | Marca jerarquía visual sin invadir el primario de acciones. |
| **Section title** | 14px uppercase `--sura-azul-prof` | Header de card y sub-secciones. |
| **Iconografía** | SVG monoline 2px `currentColor` | Sin emoji, sin Unicode decorativo. |
| **Voz** | Español MX, informal "tú", optimista | "¡Si algo pasa, no pasa nada!" también en admin. |
| **`.ptag` / `pending-banner`** | Solo en prototipos y handoff | Se remueven antes de producción. |

## Color

Paleta principal:

- **Azul cielo** `--sura-azul-cielo` `#2D6DF6` · **primario** — CTAs, headers de app, footers, links, focus, selección
- **Amarillo sol** `--sura-amarillo` `#E3E829` · **CTA principal de la pantalla**, 1 por surface
- **Azul institucional** `--sura-azul-prof` `#0033A0` · **secundario** — sub-títulos (H2), section titles, secondary outline, info
- **Azul oscuro** `--sura-azul-oscuro` `#00003F` · solo superficies dark puntuales (doc-card head, ref-block)
- **Azul soft** `--sura-azul-soft` `#DFEAFF` · fondo de selección, info soft
- **Aqua / Morado** `#00AEC7` / `#662D83` · acentos puntuales (logo, gráficas)

Semántica de estados — cada uno con strong (-1), soft (-2) y border:

| Estado | Strong | Soft | Significado |
|---|---|---|---|
| Success `--success-*` | `#067014` | `#E6FAEF` | Terminal OK · Aplicado · HABER contable |
| Warning `--warning-*` | `#ED8B00` | `#FFF5EC` | Atención · saldo > 0 · pendiente — nunca terminal |
| Danger `--danger-*` | `#D12D35` | `#FFF4F3` | Terminal mal · Anulado · DEBE · errores bloqueantes |
| Info `--info-*` | `#0033A0` | `#DFEAFF` | Estado neutro con acción · Pendiente · Aplicación parcial |

**Reglas de color rigurosas:** ver `design-rules.md` §1.

## Tipografía

- Familia: **Sura Sans** (400 Regular, 600 Seminegrita —cae a Negrita—, 700 Negrita). Stack fallback: system-ui.
- Mono: **SF Mono / Menlo / Consolas**. Usado para todos los identificadores alfanuméricos.
- Escala admin (densa): 24 / 20 / 17 / 15 / 14 / 13 / 12 / 11 / 10 px.
- H1 24px neutro (`--fg-1`), section titles 14px uppercase azul institucional.
- Montos: `font-variant-numeric: tabular-nums`. Identificadores: clase `.mono`.

## Iconografía

- Set en `assets/icons/` — 37 iconos SVG monoline 2px, `viewBox=24×24`, `stroke="currentColor"`.
- Usa `icons.js` para inline render: `<i data-icon="alert-triangle"></i>`.
- Tamaños: 16 small (inline), 24 default, 32 feature.
- **Prohibido:** emoji, Unicode glyph decorativo, FontAwesome solid.

## Componentes principales

Ver `Mood Board.html` para showcase completo. Cubre:

| Categoría | Clases / componentes |
|---|---|
| Layout | `.nav-top`, `.nav-main`, `.bc`, `.page-wrap`, `.page-header` |
| Card | `.card`, `.card__head`, `.card__title`, `.card__body`, `.card__foot` |
| Botones | `.btn` + `.btn--primary` `.btn--cta` (alias `.btn--final`) `.btn--secondary` `.btn--ghost` `.btn--danger` `.btn--dark` `.btn--sm` `.btn--lg` `.btn--icon` |
| Forms | `.field`, `.input`, `.search`, `.check` (tri-state), `.radio`, `.radio-tile`, `.filters-bar`, `.label` |
| Badges/chips | `.badge` + `.badge--ok/warn/err/info/mute/solid`, `.fchip`, `.recibo-chip`, `.nat-chip`, `.ptag`, `.count-pill`, `.avatar` |
| Tabla · única | `.table-wrap`, `.table` + modifiers `--compact/spacious/striped/bordered`, `.td-folio/mono/amount/date/desc/actions`, `.radio-cell/radio-dot`, `.exp-toggle/exp-panel`, `.pagination` — **No se inventan tablas paralelas** (regla dura, ver `design-rules.md` Principio 9) |
| Patrones | `.hero-strip` (métricas), `.entity-hero` (identidad), `.kv-grid`, `.ledger` (tabular sin tabla, 2 cols), `.doc-card`, `.doc-row` + `.doc-list`, `.ref-block`, `.selected-summary`, `.context-banner` |
| Feedback | `.modal` + `.modal--confirm` (`--info/--warn/--ok/--danger`), `.toast`, `.alert`, `.pending-banner`, `.empty-state` |
| Proceso | `.stepper` + `.stepper--compact`, `.step`, `.tabs`, `.tab`, `.accordion`, `.acc-item`, `.status-timeline` (avance asíncrono) |
| Wizard | `.wizard-footer` + `.wizard-footer__inner`, `.footer-hint`, `.saved-indicator` |

## Voz y copy

- 100% español (México). Informal **"tú"**.
- Tono: calmo, optimista, humano. Frase de marca: *"¡Si algo pasa, no pasa nada!"*.
- Verbos en infinitivo para botones: *Guardar*, *Confirmar*, *Liberar*, *Anular*.
- Moneda: MXN con `$` y separador `,` — `$ 4,850.00`. Fechas: `dd/mm/aaaa`.
- Helper / error abajo del campo en 12px. Sin emoji.
- Abreviaciones: *CP*, *RFC*, *CURP*, *VIN* aceptadas.

Ejemplos:
- Empty state: *"Aún no tienes recibos en tu bandeja. Cuando llegue uno nuevo, lo verás aquí."*
- Toast OK: *"Liberación confirmada · 3 recibos actualizados."*
- Toast error: *"No pudimos conectar al servicio de cobranza. Intenta de nuevo."*
- Confirmación: *"¿Confirmas la liberación anticipada?"*

## Lo que sale (deprecado vs. versión anterior)

- ❌ **Sub-tema Brand de Evoluciona** (Cotizador, Mi SURA, landings) — fuera del scope de este proyecto.
- ❌ **Azul vivo `#2D6DF6` como primario en Cobranza** vs. **Azul institucional `#0033A0`** — se resuelve a **Azul cielo `#2D6DF6` primario / Azul institucional `#0033A0` secundario**.
- ❌ **Botones rectangulares 8px** del Cobranza original — ahora pill 999.
- ❌ **Inputs con redondeo completo** del Cobranza original — ahora top-only 12px.
- ❌ **Cards a 12px** del Cobranza original — ahora 16px (modal 20).
- ❌ **Escala 8-pt estricta** de Evoluciona — relajada a 4-pt para densidad operativa.
- ❌ **Emoji `⚠ 📄 📭 ✓` temporales** del Cobranza original — reemplazados por SVG monoline.
- ❌ **System font stack** del Cobranza original — ahora Sura Sans.
- ❌ **v1.0:** `.check` como wrapper de native input — v1.1: `.check` es checkbox cuadrado tri-state (off / on / indet). Para wrapper de native input usa `.radio`.
- ❌ **v1.1:** inventar `.inline-table`, `.dense-table`, `.mini-table` — una sola tabla, la del DS, con modifiers.

## Changelog

### v1.3 · Mayo 2026 (aditivo, sin breaking de tokens)

Absorbe el componente `.ledger` del proyecto **Detalle de Promotor** — alternativa editorial a la tabla del DS para listas de pares etiqueta/valor que pedían tabular pero con tabla quedaban sobrediseadas.

**Nuevo componente en `components.css`:**
- `.ledger` + `.ledger__group` + `.ledger__header` (`__eyebrow`, `__rule`, `__count`) + `.ledger__items` + `.ledger-line` (`__lbl`, `__dots`, `__val`) — lista densa de pares etiqueta/valor con dots-leader tipográfico, opcionalmente agrupada por header. Variante `.ledger--flat` (sin grupos, un bloque plano). Variantes del valor: `--muted` / `--strong` / `--ok` / `--warn`. Variantes del grid: `--narrow` / `--wide`.

**Nueva regla en `design-rules.md`:**
- **Decisión 15** — Ledger vs tabla. Reservado a listas con exactamente 2 columnas semánticas, no interactivas, con valores homogéneos. Tres condiciones obligatorias.
- **Anti-patrones 21-22** — No usar ledger para datos interactivos; no inventar `.ledger--bordered/--striped` (lo regresa a tabla).

**Nuevo showcase:**
- `Componentes Nuevos v1.3.html` — anatomía, variantes, ejemplos reales (comisión por ramo, impuestos y retenciones, parámetros) y reglas de uso.

Sin cambios en `tokens.css`.

### v1.2 · Mayo 2026 (aditivo, sin breaking de tokens)

Inputs compuestos basados en el Figma de marca + refinamiento del toast existente.

**Nuevos componentes en `components.css`:**
- `.ds-select` + `.ds-panel` — **dropdown** con popover propio (no `<select>` nativo). Soporta grupos titulados, iconos por item y items seleccionados con check.
- `.ds-datepicker` + `.ds-cal` — **datepicker** con 3 vistas (día / mes / año), rango (`--range-start/--in-range/--range-end`) y today vs selected diferenciados.
- `.ds-multiselect` + `.ms-chip` — **multi-select** con chips removibles dentro del campo y colapso a `+ N` cuando no caben. Cada chip tiene su X; X grande limpia todos.
- `.ds-field` — chrome común a los 3 controles (radio top-only 12px, alto 48px, full border). Estados `.is-open / .is-filled / .is-error / .is-disabled` en el wrapper.

**Refinos al toast existente:**
- `.toast--secure` — variante azul institucional con icono escudo (mensajes de verificación / 2FA).
- `.toast--single` — variante compacta de 1 línea (sin `__bar` interno; el accent vive en `border-left`).

**Nuevo showcase:**
- `Componentes Nuevos v1.2.html` — documentación completa con anatomía, estados, ejemplos interactivos y reglas de uso.

Sin cambios en `tokens.css`.

### v1.1 · Mayo 2026 (aditivo, sin breaking de tokens)

Absorbe componentes y decisiones del proyecto **Alta / Detalle de Promotor**.

**Nuevos componentes en `components.css`:**
- `.status-timeline` (+ `--compact`) — avance asíncrono del proceso en sidebar sticky
- `.modal--confirm` (+ `--info/--warn/--ok/--danger`) — variante de modal para confirmar acciones
- `.radio-tile` (+ `.radio-group`) — radio en formato tarjeta con título + descripción
- `.doc-row` + `.doc-list` — fila/lista de documentos con estado `is-done`
- `.context-banner` — info banner inline con accent-left y label/value
- `.entity-hero` — hero de detalle (identidad). Coexiste con `.hero-strip` (métricas)
- `.wizard-footer` + `.saved-indicator` + `.footer-hint` — footer sticky para wizards
- `.stepper--compact` — variante densa del stepper para wizards de 5+ pasos
- `.check` reimplementado — checkbox cuadrado tri-state (off / on / indet)

**Nuevas reglas en `design-rules.md`:**
- **Principio 9** — Una sola tabla. Toda tabla del producto usa `.table` con sus modifiers. Prohíbido inventar tablas paralelas.
- **Decisión 13** — Sidebar de avance del proceso (status timeline). Cuándo y cómo usarlo.
- **Decisión 14** — Breakpoints solo desktop. Boundary 1200px para multi-columna; <1200px una sola columna.
- **Anti-patrones 17–20** — No inventar tablas paralelas, no usar sub-grid 2-col bajo 1200px, no mezclar hero-strip + entity-hero, no confundir status-timeline con stepper.

Sin cambios en `tokens.css`.

## Archivos del proyecto

| Archivo | Qué es |
|---|---|
| `README.md` | Este archivo — overview de sistema, decisiones, paleta, voz |
| `SKILL.md` | Entrypoint compatible con Agent Skills |
| `design-rules.md` | "Cuándo usar qué y por qué" — decisiones específicas, anti-patrones, checklist |
| `tokens.css` | Variables CSS — color, tipografía, espaciado, radii, sombras, transiciones |
| `components.css` | Clases componentes — botones, inputs, tabla, cards, modal, etc. |
| `icons.js` | Helper inline-SVG con `currentColor` (37 iconos) |
| `assets/icons/*.svg` | Set de iconos monoline 2px |
| `assets/sura-logo*.svg` | Logo SURA (color + blanco para fondos dark) |
| `fonts/SuraSans-*.woff` | Familia Sura Sans (Regular + Negrita) |
| `Mood Board.html` | Showcase completo de tokens y componentes (tabla con Tweaks) |
| `Componentes Nuevos v1.2.html` | Showcase v1.2 — inputs compuestos (dropdown, datepicker, multi-select) + refinos al toast |
| `Componentes Nuevos v1.3.html` | Showcase v1.3 — componente `.ledger` (tabular sin tabla) |
| `CRUD Example.html` | Pantalla end-to-end demostrando las reglas |

## Caveats

- Solo **Regular (400)** y **Negrita (700)** de Sura Sans están en `fonts/`. Seminegrita (600) cae sobre Negrita — pedir `SuraSans-Seminegrita.woff` al equipo de marca cuando esté disponible.
- El set de iconos tiene 37 piezas. Si necesitas más, **port** desde el Figma "Sistema de diseño.fig" (`/Icons/conos/`) en el mismo estilo monoline 2px — no descarguen sets externos.
- Logo aqua (`#00AEC7`) sobre claro; blanco sobre oscuro. Min height 32px, escalar solo por altura.
- `.ptag` y `.pending-banner` están en el sistema pero son **patrones de prototipado/handoff**. Se quitan antes de producción.
