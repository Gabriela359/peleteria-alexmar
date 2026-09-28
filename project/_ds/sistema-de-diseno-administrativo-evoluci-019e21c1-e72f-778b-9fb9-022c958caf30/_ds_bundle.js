/* @ds-bundle: {"format":3,"namespace":"SistemaDeDisenoAdministrativoEvoluciona_019e21","components":[],"sourceHashes":{"icons.js":"eb1aa335c2da","mood-board-table.jsx":"6ffe00657e16","tweaks-panel.jsx":"22c052960f83"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.SistemaDeDisenoAdministrativoEvoluciona_019e21 = window.SistemaDeDisenoAdministrativoEvoluciona_019e21 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// icons.js
try { (() => {
// Auto-generated icon map — all SVGs from assets/icons/, inline with currentColor
window.ICONS = {
  "alert-triangle": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
  "arrow-right": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>`,
  "bell": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`,
  "calendar": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M3 9h18M8 3v4M16 3v4"></path></svg>`,
  "car": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h13l4 4v8a2 2 0 0 1-2 2H3z"></path><circle cx="8" cy="17" r="2"></circle><circle cx="17" cy="17" r="2"></circle></svg>`,
  "card": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="2"></rect><path d="M3 10h18M7 15h4"></path></svg>`,
  "check": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m8 12 3 3 5-6"></path></svg>`,
  "checkmark": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"></path></svg>`,
  "chevron-down": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"></path></svg>`,
  "chevron-left": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 6 9 12 15 18"></polyline></svg>`,
  "chevron-right-thin": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"></polyline></svg>`,
  "chevron-right": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
  "clock": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
  "close": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"></path></svg>`,
  "dots": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>`,
  "download": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
  "edit": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
  "file": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`,
  "filter": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>`,
  "heart": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l8.84 8.84 8.84-8.84a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
  "home": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"></path></svg>`,
  "inbox": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>`,
  "info": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v5M12 16.5v.5"></path></svg>`,
  "lock": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
  "menu": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v4H3zM3 10h18v4H3zM3 17h18v4H3z"></path></svg>`,
  "pencil": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M 23.12 0.88 C 22.53 0.29 21.76 0 20.99 0 C 20.22 0 19.44 0.29 18.85 0.88 L 15.67 4.06 L 14.73 5.0 L 13.37 6.37 L 12.74 7.0 C 12.11 7.71 12.12 8.78 12.8 9.45 L 13.99 8.26 L 15.57 6.68 L 17.32 8.43 L 6.37 19.38 L 4.62 17.63 L 10.25 11.99 C 10.88 11.3 11.01 10.08 10.34 9.4 L 9.08 10.65 L 8.86 10.87 L 2.74 16.99 C 2.66 17.07 2.6 17.16 2.56 17.25 L 0.08 22.74 C -0.07 23.08 0.0 23.47 0.26 23.74 C 0.51 24.0 0.91 24.07 1.25 23.92 L 6.74 21.43 C 6.83 21.39 6.92 21.33 7.0 21.25 L 23.12 5.13 C 23.71 4.55 24 3.77 24 3.0 C 24 2.23 23.71 1.45 23.12 0.87 L 23.12 0.88 Z" fill="currentColor"></path></svg>`,
  "plus": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
  "refresh": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`,
  "save": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>`,
  "search": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.8" fill="none"></circle><line x1="15" y1="15" x2="21" y2="21" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"></line></svg>`,
  "send": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`,
  "shield-check": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s-8-4.5-8-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.5-8 11-8 11z" fill="none"></path><path d="M12 7v4M10 9h4"></path></svg>`,
  "shield": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 3 7v5c0 5 4 9 9 10 5-1 9-5 9-10V7z"></path><path d="m8.5 12.5 2.5 2.5 4.5-5"></path></svg>`,
  "trash": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
  "upload": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>`,
  "user": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"></circle><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"></path></svg>`,
  "users": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
  "x-octagon": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`
};

// Renderer: replace <i data-icon="name"></i> placeholders with inline SVG
function renderIcons(root) {
  root = root || document;
  root.querySelectorAll('[data-icon]').forEach(el => {
    const name = el.getAttribute('data-icon');
    const svg = window.ICONS[name];
    if (!svg) {
      console.warn('Missing icon:', name);
      return;
    }
    const size = el.getAttribute('data-size');
    let injected = svg;
    if (size) injected = injected.replace(/width="24"/, 'width="' + size + '"').replace(/height="24"/, 'height="' + size + '"');
    el.innerHTML = injected;
    el.classList.add('icon');
  });
}
window.renderIcons = renderIcons;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => renderIcons());
} else {
  renderIcons();
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "icons.js", error: String((e && e.message) || e) }); }

// mood-board-table.jsx
try { (() => {
// Mood Board · Table demo with Tweaks
// The featured table component — admin "todo terreno" with multiple variants.
// Tweaks let the user toggle density, expandable rows, selection, striping,
// pagination, and a "simple vs complete" preset.

const {
  useState,
  useMemo
} = React;
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "preset": "complete",
  "density": "regular",
  "expandable": true,
  "selection": true,
  "striped": false,
  "bordered": false,
  "pagination": true,
  "stickyHeader": true,
  "showActions": true
} /*EDITMODE-END*/;

// Sample data — recibos por póliza (mismo dominio que Cobranza)
const ROWS = [{
  id: "FCO-2026-001458",
  poliza: "PR-CASCO-882319",
  contratante: "López Martínez, María del Carmen",
  division: "Personal",
  periodicidad: "Mensual",
  vence: "12/05/2026",
  estado: "Pendiente",
  estadoVar: "info",
  monto: 12450.00,
  nat: "haber",
  saldo: 0,
  recibo: "FCO-2026-001458"
}, {
  id: "FCO-2026-001459",
  poliza: "PR-CASCO-882319",
  contratante: "López Martínez, María del Carmen",
  division: "Personal",
  periodicidad: "Mensual",
  vence: "12/06/2026",
  estado: "Pendiente",
  estadoVar: "info",
  monto: 12450.00,
  nat: "haber",
  saldo: 12450.00,
  recibo: "FCO-2026-001459"
}, {
  id: "FCO-2026-002104",
  poliza: "CM-HOGAR-441208",
  contratante: "Constructora del Bajío SA",
  division: "Comercial",
  periodicidad: "Anual",
  vence: "01/03/2026",
  estado: "Aplicado",
  estadoVar: "ok",
  monto: 88200.00,
  nat: "haber",
  saldo: 0,
  recibo: "FCO-2026-002104"
}, {
  id: "FCO-2026-002201",
  poliza: "CM-HOGAR-441208",
  contratante: "Constructora del Bajío SA",
  division: "Comercial",
  periodicidad: "Anual",
  vence: "15/04/2026",
  estado: "Aplicación parcial",
  estadoVar: "warn",
  monto: 88200.00,
  nat: "haber",
  saldo: 28200.00,
  recibo: "FCO-2026-002201"
}, {
  id: "FCO-2026-003027",
  poliza: "PR-AUTO-771145",
  contratante: "Hernández Ruiz, Jorge",
  division: "Personal",
  periodicidad: "Semestral",
  vence: "20/05/2026",
  estado: "Anulado",
  estadoVar: "err",
  monto: 7820.00,
  nat: "debe",
  saldo: 0,
  recibo: null
}, {
  id: "FCO-2026-003028",
  poliza: "PR-AUTO-771145",
  contratante: "Hernández Ruiz, Jorge",
  division: "Personal",
  periodicidad: "Semestral",
  vence: "20/11/2026",
  estado: "Bloqueado",
  estadoVar: "err",
  monto: 7820.00,
  nat: "haber",
  saldo: 7820.00,
  recibo: "FCO-2026-003028"
}, {
  id: "FCO-2026-004510",
  poliza: "CM-VIDA-118822",
  contratante: "Servicios Logísticos del Norte SAPI",
  division: "Comercial",
  periodicidad: "Mensual",
  vence: "08/05/2026",
  estado: "Pendiente",
  estadoVar: "info",
  monto: 4250.00,
  nat: "haber",
  saldo: 4250.00,
  recibo: "FCO-2026-004510"
}, {
  id: "FCO-2026-005118",
  poliza: "PR-VIDA-559820",
  contratante: "Ramírez de la Cruz, Ana Sofía",
  division: "Personal",
  periodicidad: "Anual",
  vence: "01/12/2026",
  estado: "Emitido",
  estadoVar: "mute",
  monto: 22100.00,
  nat: "haber",
  saldo: 0,
  recibo: "FCO-2026-005118"
}];
const ESTADO_VARS = {
  ok: "ok",
  warn: "warn",
  err: "err",
  info: "info",
  mute: "mute"
};
function fmtMx(n) {
  return n.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
function TableDemo() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [selected, setSelected] = useState("FCO-2026-001459");
  const [expanded, setExpanded] = useState(new Set(["FCO-2026-002201"]));

  // Preset handler — flip all flags at once
  function applyPreset(preset) {
    if (preset === "simple") {
      setTweak({
        preset: "simple",
        density: "regular",
        expandable: false,
        selection: false,
        striped: false,
        bordered: false,
        pagination: false,
        stickyHeader: false,
        showActions: false
      });
    } else if (preset === "complete") {
      setTweak({
        preset: "complete",
        density: "regular",
        expandable: true,
        selection: true,
        striped: false,
        bordered: false,
        pagination: true,
        stickyHeader: true,
        showActions: true
      });
    } else if (preset === "dense") {
      setTweak({
        preset: "dense",
        density: "compact",
        expandable: true,
        selection: true,
        striped: true,
        bordered: false,
        pagination: true,
        stickyHeader: true,
        showActions: true
      });
    } else {
      setTweak({
        preset: "custom"
      });
    }
  }
  function toggleExpand(id) {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);else next.add(id);
    setExpanded(next);
  }

  // Build table classes from tweaks
  const tableCls = ["table", t.density === "compact" && "table--compact", t.density === "spacious" && "table--spacious", t.striped && "table--striped", t.bordered && "table--bordered"].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "table-wrap",
    style: {
      maxHeight: t.stickyHeader ? 540 : "none",
      overflowY: t.stickyHeader ? "auto" : "visible"
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: tableCls
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, t.selection && /*#__PURE__*/React.createElement("th", {
    className: "radio-cell"
  }), t.expandable && /*#__PURE__*/React.createElement("th", {
    style: {
      width: 30
    }
  }), /*#__PURE__*/React.createElement("th", {
    "data-sort": "folio",
    className: "sorted"
  }, /*#__PURE__*/React.createElement("span", {
    className: "th-content"
  }, "Folio ", /*#__PURE__*/React.createElement("span", {
    className: "sort-ind"
  }, "\u25BC"))), /*#__PURE__*/React.createElement("th", {
    "data-sort": "poliza"
  }, /*#__PURE__*/React.createElement("span", {
    className: "th-content"
  }, "P\xF3liza ", /*#__PURE__*/React.createElement("span", {
    className: "sort-ind idle"
  }, "\u2195"))), /*#__PURE__*/React.createElement("th", {
    "data-sort": "contratante"
  }, /*#__PURE__*/React.createElement("span", {
    className: "th-content"
  }, "Contratante ", /*#__PURE__*/React.createElement("span", {
    className: "sort-ind idle"
  }, "\u2195"))), /*#__PURE__*/React.createElement("th", {
    className: "col-center"
  }, "Estado"), /*#__PURE__*/React.createElement("th", {
    className: "col-center"
  }, "Nat."), /*#__PURE__*/React.createElement("th", {
    "data-sort": "vence"
  }, /*#__PURE__*/React.createElement("span", {
    className: "th-content"
  }, "Vence ", /*#__PURE__*/React.createElement("span", {
    className: "sort-ind idle"
  }, "\u2195"))), /*#__PURE__*/React.createElement("th", {
    className: "col-amount",
    "data-sort": "monto"
  }, /*#__PURE__*/React.createElement("span", {
    className: "th-content"
  }, "Monto ", /*#__PURE__*/React.createElement("span", {
    className: "sort-ind idle"
  }, "\u2195"))), /*#__PURE__*/React.createElement("th", {
    className: "col-amount"
  }, "Saldo"), t.showActions && /*#__PURE__*/React.createElement("th", {
    style: {
      width: 60
    }
  }))), /*#__PURE__*/React.createElement("tbody", null, ROWS.map(r => {
    const isSel = t.selection && selected === r.id;
    const isExp = t.expandable && expanded.has(r.id);
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: r.id
    }, /*#__PURE__*/React.createElement("tr", {
      className: [isSel && "is-selected", isExp && "is-expanded"].filter(Boolean).join(" "),
      onClick: () => t.selection && setSelected(r.id),
      style: {
        cursor: t.selection ? "pointer" : "default"
      }
    }, t.selection && /*#__PURE__*/React.createElement("td", {
      className: "radio-cell"
    }, /*#__PURE__*/React.createElement("span", {
      className: "radio-dot"
    })), t.expandable && /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("button", {
      className: "exp-toggle " + (isExp ? "open" : ""),
      onClick: e => {
        e.stopPropagation();
        toggleExpand(r.id);
      },
      "aria-label": "Expandir fila"
    }, /*#__PURE__*/React.createElement("span", {
      dangerouslySetInnerHTML: {
        __html: window.ICONS["chevron-down"] || ""
      }
    }))), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
      className: "td-folio"
    }, r.id)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
      className: "td-mono"
    }, r.poliza)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", null, r.contratante), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "var(--fg-3)"
      }
    }, r.division, " \xB7 ", r.periodicidad)), /*#__PURE__*/React.createElement("td", {
      style: {
        textAlign: "center"
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "badge badge--" + ESTADO_VARS[r.estadoVar] + " badge--sm"
    }, r.estado)), /*#__PURE__*/React.createElement("td", {
      style: {
        textAlign: "center"
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "nat-chip nat-chip--" + r.nat
    }, r.nat === "haber" ? "HABER" : "DEBE")), /*#__PURE__*/React.createElement("td", {
      className: "td-date"
    }, r.vence), /*#__PURE__*/React.createElement("td", {
      className: "td-amount " + (r.nat === "haber" ? "td-amount--haber" : "td-amount--debe")
    }, "$ ", fmtMx(r.monto)), /*#__PURE__*/React.createElement("td", {
      className: "td-amount " + (r.saldo > 0 ? "td-amount--warn" : ""),
      style: r.saldo === 0 ? {
        color: "var(--fg-3)"
      } : null
    }, "$ ", fmtMx(r.saldo)), t.showActions && /*#__PURE__*/React.createElement("td", {
      className: "td-actions"
    }, /*#__PURE__*/React.createElement("button", {
      className: "btn btn--ghost btn--icon btn--sm",
      title: "M\xE1s"
    }, /*#__PURE__*/React.createElement("span", {
      dangerouslySetInnerHTML: {
        __html: window.ICONS["dots"] || ""
      }
    })))), isExp && /*#__PURE__*/React.createElement("tr", {
      className: "exp-row"
    }, /*#__PURE__*/React.createElement("td", {
      colSpan: 6 + (t.selection ? 1 : 0) + (t.expandable ? 1 : 0) + (t.showActions ? 1 : 0)
    }, /*#__PURE__*/React.createElement("div", {
      className: "exp-panel"
    }, /*#__PURE__*/React.createElement("div", {
      className: "exp-panel__section"
    }, "Datos del contratante"), /*#__PURE__*/React.createElement("div", {
      className: "exp-panel__item"
    }, /*#__PURE__*/React.createElement("span", {
      className: "exp-panel__lbl"
    }, "RFC"), /*#__PURE__*/React.createElement("span", {
      className: "exp-panel__val mono"
    }, "LOMA850712HJ4")), /*#__PURE__*/React.createElement("div", {
      className: "exp-panel__item"
    }, /*#__PURE__*/React.createElement("span", {
      className: "exp-panel__lbl"
    }, "Tel\xE9fono"), /*#__PURE__*/React.createElement("span", {
      className: "exp-panel__val mono"
    }, "55 1234 5678")), /*#__PURE__*/React.createElement("div", {
      className: "exp-panel__item"
    }, /*#__PURE__*/React.createElement("span", {
      className: "exp-panel__lbl"
    }, "Email"), /*#__PURE__*/React.createElement("span", {
      className: "exp-panel__val"
    }, "maria.lopez@example.com")), /*#__PURE__*/React.createElement("div", {
      className: "exp-panel__item"
    }, /*#__PURE__*/React.createElement("span", {
      className: "exp-panel__lbl"
    }, "Sucursal"), /*#__PURE__*/React.createElement("span", {
      className: "exp-panel__val"
    }, "CDMX Centro")), /*#__PURE__*/React.createElement("div", {
      className: "exp-panel__item"
    }, /*#__PURE__*/React.createElement("span", {
      className: "exp-panel__lbl"
    }, "Asesor"), /*#__PURE__*/React.createElement("span", {
      className: "exp-panel__val"
    }, "Ana L\xF3pez (AL)")), /*#__PURE__*/React.createElement("div", {
      className: "exp-panel__section"
    }, "Recibo / movimientos"), /*#__PURE__*/React.createElement("div", {
      className: "exp-panel__item"
    }, /*#__PURE__*/React.createElement("span", {
      className: "exp-panel__lbl"
    }, "Recibo asociado"), /*#__PURE__*/React.createElement("span", {
      className: "exp-panel__val"
    }, r.recibo ? /*#__PURE__*/React.createElement("span", {
      className: "recibo-chip"
    }, /*#__PURE__*/React.createElement("span", {
      dangerouslySetInnerHTML: {
        __html: window.ICONS["file"] || ""
      },
      style: {
        width: 12,
        height: 12,
        display: "inline-flex"
      }
    }), r.recibo) : "—")), /*#__PURE__*/React.createElement("div", {
      className: "exp-panel__item"
    }, /*#__PURE__*/React.createElement("span", {
      className: "exp-panel__lbl"
    }, "Fecha emisi\xF3n"), /*#__PURE__*/React.createElement("span", {
      className: "exp-panel__val"
    }, "28/04/2026")), /*#__PURE__*/React.createElement("div", {
      className: "exp-panel__item"
    }, /*#__PURE__*/React.createElement("span", {
      className: "exp-panel__lbl"
    }, "Forma de pago"), /*#__PURE__*/React.createElement("span", {
      className: "exp-panel__val"
    }, "Domiciliaci\xF3n")), /*#__PURE__*/React.createElement("div", {
      className: "exp-panel__item"
    }, /*#__PURE__*/React.createElement("span", {
      className: "exp-panel__lbl"
    }, "Comisi\xF3n"), /*#__PURE__*/React.createElement("span", {
      className: "exp-panel__val"
    }, "$ 1,245.00")), /*#__PURE__*/React.createElement("div", {
      className: "exp-panel__item"
    }, /*#__PURE__*/React.createElement("span", {
      className: "exp-panel__lbl"
    }, "IVA aplicado"), /*#__PURE__*/React.createElement("span", {
      className: "exp-panel__val"
    }, "16%")), /*#__PURE__*/React.createElement("div", {
      className: "exp-panel__actions"
    }, /*#__PURE__*/React.createElement("button", {
      className: "btn btn--ghost btn--sm"
    }, /*#__PURE__*/React.createElement("span", {
      dangerouslySetInnerHTML: {
        __html: window.ICONS["file"] || ""
      },
      style: {
        width: 14,
        height: 14,
        display: "inline-flex"
      }
    }), "Ver recibo"), /*#__PURE__*/React.createElement("button", {
      className: "btn btn--ghost btn--sm"
    }, /*#__PURE__*/React.createElement("span", {
      dangerouslySetInnerHTML: {
        __html: window.ICONS["download"] || ""
      },
      style: {
        width: 14,
        height: 14,
        display: "inline-flex"
      }
    }), "Descargar"), /*#__PURE__*/React.createElement("button", {
      className: "btn btn--secondary btn--sm"
    }, "Aplicar pago"), /*#__PURE__*/React.createElement("button", {
      className: "btn btn--final btn--sm"
    }, "Liberar anticipadamente"))))));
  }))), t.pagination && /*#__PURE__*/React.createElement("div", {
    className: "pagination"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pagination__info"
  }, "Mostrando 1-8 de 142", /*#__PURE__*/React.createElement("select", {
    defaultValue: "10"
  }, /*#__PURE__*/React.createElement("option", {
    value: "10"
  }, "10 por p\xE1gina"), /*#__PURE__*/React.createElement("option", {
    value: "25"
  }, "25 por p\xE1gina"), /*#__PURE__*/React.createElement("option", {
    value: "50"
  }, "50 por p\xE1gina"))), /*#__PURE__*/React.createElement("div", {
    className: "pagination__pages"
  }, /*#__PURE__*/React.createElement("button", {
    className: "page-btn",
    disabled: true
  }, "\u2039"), /*#__PURE__*/React.createElement("button", {
    className: "page-btn active"
  }, "1"), /*#__PURE__*/React.createElement("button", {
    className: "page-btn"
  }, "2"), /*#__PURE__*/React.createElement("button", {
    className: "page-btn"
  }, "3"), /*#__PURE__*/React.createElement("button", {
    className: "page-btn"
  }, "\u2026"), /*#__PURE__*/React.createElement("button", {
    className: "page-btn"
  }, "18"), /*#__PURE__*/React.createElement("button", {
    className: "page-btn"
  }, "\u203A")))), /*#__PURE__*/React.createElement(TweaksPanel, {
    title: "Tabla \xB7 Tweaks"
  }, /*#__PURE__*/React.createElement(TweakSection, {
    label: "Preset"
  }), /*#__PURE__*/React.createElement(TweakRadio, {
    label: "Versi\xF3n",
    value: t.preset,
    options: ["simple", "complete", "dense"],
    onChange: v => applyPreset(v)
  }), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Densidad"
  }), /*#__PURE__*/React.createElement(TweakRadio, {
    label: "Padding",
    value: t.density,
    options: ["compact", "regular", "spacious"],
    onChange: v => {
      setTweak({
        density: v,
        preset: "custom"
      });
    }
  }), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Comportamiento"
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Filas expandibles",
    value: t.expandable,
    onChange: v => setTweak({
      expandable: v,
      preset: "custom"
    })
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Selecci\xF3n con radio",
    value: t.selection,
    onChange: v => setTweak({
      selection: v,
      preset: "custom"
    })
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Acciones por fila",
    value: t.showActions,
    onChange: v => setTweak({
      showActions: v,
      preset: "custom"
    })
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Header sticky",
    value: t.stickyHeader,
    onChange: v => setTweak({
      stickyHeader: v,
      preset: "custom"
    })
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Paginaci\xF3n",
    value: t.pagination,
    onChange: v => setTweak({
      pagination: v,
      preset: "custom"
    })
  }), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Estilo"
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Zebra (striped)",
    value: t.striped,
    onChange: v => setTweak({
      striped: v,
      preset: "custom"
    })
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Bordes verticales",
    value: t.bordered,
    onChange: v => setTweak({
      bordered: v,
      preset: "custom"
    })
  })));
}

// Mount as soon as React + tweaks-panel are ready
function mountTableDemo() {
  if (typeof React === "undefined" || typeof useTweaks === "undefined") {
    return setTimeout(mountTableDemo, 50);
  }
  const root = document.getElementById("table-demo-root");
  if (!root) return;
  ReactDOM.createRoot(root).render(/*#__PURE__*/React.createElement(TableDemo, null));
}
mountTableDemo();
})(); } catch (e) { __ds_ns.__errors.push({ path: "mood-board-table.jsx", error: String((e && e.message) || e) }); }

// tweaks-panel.jsx
try { (() => {
// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "palette": ["#D97757", "#29261b", "#f6f4ef"],
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        options={['#D97757', '#2A6FDB', '#1F8A5B', '#7A5AE0']}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakColor  label="Palette" value={t.palette}
//                        options={[['#D97757', '#29261b', '#f6f4ef'],
//                                  ['#475569', '#0f172a', '#f1f5f9']]}
//                        onChange={(v) => setTweak('palette', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom right;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;box-sizing:border-box;min-width:0;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}

  .twk-chips{display:flex;gap:6px}
  .twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:46px;
    padding:0;border:0;border-radius:6px;overflow:hidden;cursor:default;
    box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06);
    transition:transform .12s cubic-bezier(.3,.7,.4,1),box-shadow .12s}
  .twk-chip:hover{transform:translateY(-1px);
    box-shadow:0 0 0 .5px rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.12)}
  .twk-chip[data-on="1"]{box-shadow:0 0 0 1.5px rgba(0,0,0,.85),
    0 2px 6px rgba(0,0,0,.15)}
  .twk-chip>span{position:absolute;top:0;bottom:0;right:0;width:34%;
    display:flex;flex-direction:column;box-shadow:-1px 0 0 rgba(0,0,0,.1)}
  .twk-chip>span>i{flex:1;box-shadow:0 -1px 0 rgba(0,0,0,.1)}
  .twk-chip>span>i:first-child{box-shadow:none}
  .twk-chip svg{position:absolute;top:6px;left:6px;width:13px;height:13px;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null ? keyOrEdits : {
      [keyOrEdits]: val
    };
    setValues(prev => ({
      ...prev,
      ...edits
    }));
    window.parent.postMessage({
      type: '__edit_mode_set_keys',
      edits
    }, '*');
    // Same-window signal so in-page listeners (deck-stage rail thumbnails)
    // can react — the parent message only reaches the host, not peers.
    window.dispatchEvent(new CustomEvent('tweakchange', {
      detail: edits
    }));
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({
  title = 'Tweaks',
  noDeckControls = false,
  children
}) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef(null);
  // Auto-inject a rail toggle when a <deck-stage> is on the page. The
  // toggle drives the deck's per-viewer _railVisible via window message;
  // state is mirrored from the same localStorage key the deck reads so
  // the control reflects reality across reloads. The mechanism is the
  // message — authors who want custom placement can post it directly
  // and pass noDeckControls to suppress this one.
  const hasDeckStage = React.useMemo(() => typeof document !== 'undefined' && !!document.querySelector('deck-stage'), []);
  // deck-stage enables its rail in connectedCallback, but this panel can
  // mount before that element has upgraded. The initial read catches the
  // common case; the listener covers mounting first. (Older deck-stage.js
  // copies still wait for the host's __omelette_rail_enabled postMessage —
  // same listener handles those.)
  const [railEnabled, setRailEnabled] = React.useState(() => hasDeckStage && !!document.querySelector('deck-stage')?._railEnabled);
  React.useEffect(() => {
    if (!hasDeckStage || railEnabled) return undefined;
    const onMsg = e => {
      if (e.data && e.data.type === '__omelette_rail_enabled') setRailEnabled(true);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [hasDeckStage, railEnabled]);
  const [railVisible, setRailVisible] = React.useState(() => {
    try {
      return localStorage.getItem('deck-stage.railVisible') !== '0';
    } catch (e) {
      return true;
    }
  });
  const toggleRail = on => {
    setRailVisible(on);
    window.postMessage({
      type: '__deck_rail_visible',
      on
    }, '*');
  };
  const offsetRef = React.useRef({
    x: 16,
    y: 16
  });
  const PAD = 16;
  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth,
      h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y))
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);
  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);
  React.useEffect(() => {
    const onMsg = e => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({
      type: '__edit_mode_available'
    }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({
      type: '__edit_mode_dismissed'
    }, '*');
  };
  const onDragStart = e => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX,
      sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = ev => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy)
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };
  if (!open) return null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, __TWEAKS_STYLE), /*#__PURE__*/React.createElement("div", {
    ref: dragRef,
    className: "twk-panel",
    "data-noncommentable": "",
    style: {
      right: offsetRef.current.x,
      bottom: offsetRef.current.y
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-hd",
    onMouseDown: onDragStart
  }, /*#__PURE__*/React.createElement("b", null, title), /*#__PURE__*/React.createElement("button", {
    className: "twk-x",
    "aria-label": "Close tweaks",
    onMouseDown: e => e.stopPropagation(),
    onClick: dismiss
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "twk-body"
  }, children, hasDeckStage && railEnabled && !noDeckControls && /*#__PURE__*/React.createElement(TweakSection, {
    label: "Deck"
  }, /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Thumbnail rail",
    value: railVisible,
    onChange: toggleRail
  })))));
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "twk-sect"
  }, label), children);
}
function TweakRow({
  label,
  value,
  children,
  inline = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: inline ? 'twk-row twk-row-h' : 'twk-row'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label), value != null && /*#__PURE__*/React.createElement("span", {
    className: "twk-val"
  }, value)), children);
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label,
    value: `${value}${unit}`
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    className: "twk-slider",
    min: min,
    max: max,
    step: step,
    value: value,
    onChange: e => onChange(Number(e.target.value))
  }));
}
function TweakToggle({
  label,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-row twk-row-h"
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "twk-toggle",
    "data-on": value ? '1' : '0',
    role: "switch",
    "aria-checked": !!value,
    onClick: () => onChange(!value)
  }, /*#__PURE__*/React.createElement("i", null)));
}
function TweakRadio({
  label,
  value,
  options,
  onChange
}) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  // Segments wrap mid-word once per-segment width runs out. The track is
  // ~248px (280 panel − 28 body pad − 4 seg pad), each button loses 12px
  // to its own padding, and 11.5px system-ui averages ~6.3px/char — so 2
  // options fit ~16 chars each, 3 fit ~10. Past that (or >3 options), fall
  // back to a dropdown rather than wrap.
  const labelLen = o => String(typeof o === 'object' ? o.label : o).length;
  const maxLen = options.reduce((m, o) => Math.max(m, labelLen(o)), 0);
  const fitsAsSegments = maxLen <= ({
    2: 16,
    3: 10
  }[options.length] ?? 0);
  if (!fitsAsSegments) {
    // <select> emits strings — map back to the original option value so the
    // fallback stays type-preserving (numbers, booleans) like the segment path.
    const resolve = s => {
      const m = options.find(o => String(typeof o === 'object' ? o.value : o) === s);
      return m === undefined ? s : typeof m === 'object' ? m.value : m;
    };
    return /*#__PURE__*/React.createElement(TweakSelect, {
      label: label,
      value: value,
      options: options,
      onChange: s => onChange(resolve(s))
    });
  }
  const opts = options.map(o => typeof o === 'object' ? o : {
    value: o,
    label: o
  });
  const idx = Math.max(0, opts.findIndex(o => o.value === value));
  const n = opts.length;
  const segAt = clientX => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor((clientX - r.left - 2) / inner * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };
  const onPointerDown = e => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = ev => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    role: "radiogroup",
    onPointerDown: onPointerDown,
    className: dragging ? 'twk-seg dragging' : 'twk-seg'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-seg-thumb",
    style: {
      left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
      width: `calc((100% - 4px) / ${n})`
    }
  }), opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    role: "radio",
    "aria-checked": o.value === value
  }, o.label))));
}
function TweakSelect({
  label,
  value,
  options,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("select", {
    className: "twk-field",
    value: value,
    onChange: e => onChange(e.target.value)
  }, options.map(o => {
    const v = typeof o === 'object' ? o.value : o;
    const l = typeof o === 'object' ? o.label : o;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })));
}
function TweakText({
  label,
  value,
  placeholder,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("input", {
    className: "twk-field",
    type: "text",
    value: value,
    placeholder: placeholder,
    onChange: e => onChange(e.target.value)
  }));
}
function TweakNumber({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange
}) {
  const clamp = n => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = React.useRef({
    x: 0,
    val: 0
  });
  const onScrubStart = e => {
    e.preventDefault();
    startRef.current = {
      x: e.clientX,
      val: value
    };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = ev => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-num"
  }, /*#__PURE__*/React.createElement("span", {
    className: "twk-num-lbl",
    onPointerDown: onScrubStart
  }, label), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: value,
    min: min,
    max: max,
    step: step,
    onChange: e => onChange(clamp(Number(e.target.value)))
  }), unit && /*#__PURE__*/React.createElement("span", {
    className: "twk-num-unit"
  }, unit));
}

// Relative-luminance contrast pick — checkmarks drawn over a swatch need to
// read on both #111 and #fafafa without per-option configuration. Hex input
// only (#rgb / #rrggbb); named or rgb()/hsl() colors fall through to "light".
function __twkIsLight(hex) {
  const h = String(hex).replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, c => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = n >> 16 & 255,
    g = n >> 8 & 255,
    b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}
const __TwkCheck = ({
  light
}) => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 14 14",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("path", {
  d: "M3 7.2 5.8 10 11 4.2",
  fill: "none",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  stroke: light ? 'rgba(0,0,0,.78)' : '#fff'
}));

// TweakColor — curated color/palette picker. Each option is either a single
// hex string or an array of 1-5 hex strings; the card adapts — a lone color
// renders solid, a palette renders colors[0] as the hero (left ~2/3) with the
// rest stacked in a sharp column on the right. onChange emits the
// option in the shape it was passed (string stays string, array stays array).
// Without options it falls back to the native color input for back-compat.
function TweakColor({
  label,
  value,
  options,
  onChange
}) {
  if (!options || !options.length) {
    return /*#__PURE__*/React.createElement("div", {
      className: "twk-row twk-row-h"
    }, /*#__PURE__*/React.createElement("div", {
      className: "twk-lbl"
    }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("input", {
      type: "color",
      className: "twk-swatch",
      value: value,
      onChange: e => onChange(e.target.value)
    }));
  }
  // Native <input type=color> emits lowercase hex per the HTML spec, so
  // compare case-insensitively. String() guards JSON.stringify(undefined),
  // which returns the primitive undefined (no .toLowerCase).
  const key = o => String(JSON.stringify(o)).toLowerCase();
  const cur = key(value);
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-chips",
    role: "radiogroup"
  }, options.map((o, i) => {
    const colors = Array.isArray(o) ? o : [o];
    const [hero, ...rest] = colors;
    const sup = rest.slice(0, 4);
    const on = key(o) === cur;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      type: "button",
      className: "twk-chip",
      role: "radio",
      "aria-checked": on,
      "data-on": on ? '1' : '0',
      "aria-label": colors.join(', '),
      title: colors.join(' · '),
      style: {
        background: hero
      },
      onClick: () => onChange(o)
    }, sup.length > 0 && /*#__PURE__*/React.createElement("span", null, sup.map((c, j) => /*#__PURE__*/React.createElement("i", {
      key: j,
      style: {
        background: c
      }
    }))), on && /*#__PURE__*/React.createElement(__TwkCheck, {
      light: __twkIsLight(hero)
    }));
  })));
}
function TweakButton({
  label,
  onClick,
  secondary = false
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: secondary ? 'twk-btn secondary' : 'twk-btn',
    onClick: onClick
  }, label);
}
Object.assign(window, {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakRow,
  TweakSlider,
  TweakToggle,
  TweakRadio,
  TweakSelect,
  TweakText,
  TweakNumber,
  TweakColor,
  TweakButton
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "tweaks-panel.jsx", error: String((e && e.message) || e) }); }

})();
