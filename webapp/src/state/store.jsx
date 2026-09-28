import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { buildInitialState } from '../lib/seed';
import { porTalla, unidadTxt, paresDe } from '../lib/format';

const STORAGE_KEY = 'peleteria-el-progreso:v1';

// Estas claves son "de negocio" y se guardan en localStorage. Todo lo demás
// (modales abiertos, formularios a medio llenar, toasts) es transitorio y
// se reinicia en cada carga de la app.
const PERSISTED_KEYS = [
  'role', 'user', 'screen',
  'modelos', 'ventas', 'movs', 'usuarios', 'correos', 'hora',
  'tiposExtra', 'tiposOcultos', 'seq',
  'carrito', 'metodo', 'cliente',
  'periodo', 'filtroInv', 'filtroVenta',
];

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function initialState() {
  const saved = loadPersisted();
  const base = {
    role: null, user: '', screen: 'panel',
    carrito: [], selRef: null, q: '', qInv: '', metodo: 'Efectivo', cliente: '',
    periodo: 'dia', invPag: 1, repPag: 1,
    modal: null, form: null, nuevaTalla: '', entrada: null, ajuste: null,
    filtroInv: 'activos', filtroVenta: 'todos',
    confirm: null, toast: null, nuevoCorreo: '', nuevoTipo: '',
    factura: null,
    ...buildInitialState(),
  };
  if (saved) return { ...base, ...saved };
  return base;
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, setStateRaw] = useState(initialState);

  // setState al estilo React clásico: mezcla parcial (u obtenida de una
  // función) sobre el estado actual. Los métodos de negocio de abajo NUNCA
  // llaman a `toast()` desde dentro de un updater — devuelven el mensaje
  // como parte del patch, para no anidar actualizaciones de estado.
  const setState = useCallback((patch) => {
    setStateRaw((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }));
  }, []);

  useEffect(() => {
    const toSave = {};
    for (const k of PERSISTED_KEYS) toSave[k] = state[k];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      /* almacenamiento lleno o no disponible: seguimos sin persistir */
    }
  }, [state]);

  // Autocierre del toast, 2.6s después de que aparezca.
  useEffect(() => {
    if (!state.toast) return;
    const t = setTimeout(() => setState({ toast: null }), 2600);
    return () => clearTimeout(t);
  }, [state.toast, setState]);

  const toast = useCallback((t) => setState({ toast: t }), [setState]);
  const setScreen = useCallback((s) => setState({ screen: s, modal: null }), [setState]);
  const close = useCallback(() => setState({ modal: null, confirm: null }), [setState]);

  const activos = useCallback((s = state) => s.modelos.filter((m) => !m.archivado), [state]);
  const stockTotal = useCallback((s = state) => activos(s).reduce((a, m) => a + paresDe(m), 0), [state, activos]);

  const archivar = useCallback((ref) => {
    setState((s) => {
      const m = s.modelos.find((x) => x.ref === ref);
      const nuevo = !m.archivado;
      return {
        modelos: s.modelos.map((x) => (x.ref === ref ? { ...x, archivado: nuevo } : x)),
        movs: [{
          fecha: new Date().toISOString(),
          tipo: nuevo ? 'Archivado' : 'Reactivado',
          modelo: m.ref + ' · ' + m.nombre,
          detalle: nuevo
            ? 'Sale del catálogo de venta, conserva su historial y sus ' + paresDe(m) + ' pares'
            : 'Vuelve al catálogo de venta',
          quien: s.user, pares: 0,
        }].concat(s.movs),
        toast: nuevo ? 'Modelo archivado · ya no aparece en ventas' : 'Modelo reactivado',
      };
    });
  }, [setState]);

  const addCarrito = useCallback((ref, talla, n) => {
    setState((s) => {
      const c = s.carrito.slice();
      const m = s.modelos.find((x) => x.ref === ref);
      const i = c.findIndex((x) => x.ref === ref && x.talla === talla);
      const stock = porTalla(m) ? Number(m.tallas[talla] || 0) : Number(m.stock || 0);
      const un = unidadTxt(m);
      const donde = talla ? ' en la talla ' + talla : ' de ' + m.nombre;
      let msg = null;
      if (i >= 0) {
        let q = c[i].pares + n;
        if (q > stock) { q = stock; msg = 'Solo quedan ' + stock + ' ' + un + donde; }
        if (q <= 0) c.splice(i, 1); else c[i] = { ...c[i], pares: q };
      } else if (n > 0) {
        if (stock <= 0) return { toast: 'Sin ' + un + ' disponibles' + donde };
        const q = Math.min(n, stock);
        if (q < n) msg = 'Solo quedan ' + stock + ' ' + un + donde;
        c.push({ ref, nombre: m.nombre, talla, unidad: m.unidad || 'par', pares: q, precio: m.precio, costo: m.costo });
      } else {
        return {};
      }
      return msg ? { carrito: c, toast: msg } : { carrito: c };
    });
  }, [setState]);

  const cobrar = useCallback(() => {
    setState((s) => {
      if (!s.carrito.length) return { toast: 'El carrito está vacío' };
      const seq = s.seq + 1;
      const venta = {
        id: 'F-' + String(1000 + seq), fecha: new Date().toISOString(), vendedor: s.user, metodo: s.metodo,
        cliente: s.cliente || 'Consumidor final', items: s.carrito.slice(),
        total: s.carrito.reduce((a, b) => a + b.pares * b.precio, 0),
        costo: s.carrito.reduce((a, b) => a + b.pares * b.costo, 0), devuelta: false,
      };
      const modelos = s.modelos.map((m) => {
        const it = s.carrito.filter((c) => c.ref === m.ref);
        if (!it.length) return m;
        if (!porTalla(m)) return { ...m, stock: Math.max(0, Number(m.stock || 0) - it.reduce((a, c) => a + c.pares, 0)) };
        const tallas = { ...m.tallas };
        it.forEach((c) => { tallas[c.talla] = Math.max(0, Number(tallas[c.talla] || 0) - c.pares); });
        return { ...m, tallas };
      });
      return { ventas: s.ventas.concat([venta]), modelos, seq, carrito: [], cliente: '', selRef: null, factura: venta, modal: 'factura' };
    });
  }, [setState]);

  const devolver = useCallback((id) => {
    setState((s) => {
      const v = s.ventas.find((x) => x.id === id);
      if (!v || v.devuelta) return {};
      const modelos = s.modelos.map((m) => {
        const it = v.items.filter((c) => c.ref === m.ref);
        if (!it.length) return m;
        if (!porTalla(m)) return { ...m, stock: Number(m.stock || 0) + it.reduce((a, c) => a + c.pares, 0) };
        const tallas = { ...m.tallas };
        it.forEach((c) => { tallas[c.talla] = Number(tallas[c.talla] || 0) + c.pares; });
        return { ...m, tallas };
      });
      const pares = v.items.reduce((a, i) => a + i.pares, 0);
      return {
        modelos,
        ventas: s.ventas.map((x) => (x.id === id ? { ...x, devuelta: true } : x)),
        movs: [{
          fecha: new Date().toISOString(), tipo: 'Devolución', modelo: v.items[0].ref + ' · ' + v.items[0].nombre,
          detalle: 'Devolución de la factura ' + v.id, quien: s.user, pares,
        }].concat(s.movs),
        confirm: null, modal: null,
        toast: 'Devolución registrada · ' + pares + ' pares al inventario',
      };
    });
  }, [setState]);

  const abrirModelo = useCallback((ref) => {
    setState((s) => {
      const m = s.modelos.find((x) => x.ref === ref);
      const form = m
        ? { original: m.ref, ref: m.ref, nombre: m.nombre, tipo: m.tipo, unidad: m.unidad || 'par', color: m.color, precio: String(m.precio), costo: String(m.costo), min: String(m.min), stock: String(m.stock || 0), archivado: !!m.archivado, tallas: Object.keys(m.tallas || {}).map((k) => ({ talla: k, pares: String(m.tallas[k]) })) }
        : { original: null, ref: '', nombre: '', tipo: '', unidad: 'par', color: '', precio: '', costo: '', min: '10', stock: '', archivado: false, tallas: [] };
      return { modal: 'modelo', form, nuevaTalla: '' };
    });
  }, [setState]);

  const guardarModelo = useCallback(() => {
    setState((s) => {
      const f = s.form;
      if (!f.ref.trim() || !f.nombre.trim()) return { toast: 'Referencia y nombre son obligatorios' };
      if (!f.tipo) return { toast: 'Elige el tipo de producto' };
      const tallas = {};
      f.tallas.forEach((t) => { tallas[t.talla] = Number(t.pares) || 0; });
      if (f.unidad === 'par' && !f.tallas.length) return { toast: 'Agrega al menos una talla con sus pares' };
      const nuevo = { ref: f.ref.trim().toUpperCase(), nombre: f.nombre.trim(), tipo: f.tipo, unidad: f.unidad, color: f.color, precio: Number(f.precio) || 0, costo: Number(f.costo) || 0, min: Number(f.min) || 0, tallas: f.unidad === 'par' ? tallas : {}, stock: f.unidad === 'par' ? 0 : Number(f.stock) || 0, archivado: !!f.archivado };
      const ms = s.modelos.slice();
      const i = ms.findIndex((m) => m.ref === f.original);
      if (i >= 0) ms[i] = nuevo; else ms.push(nuevo);
      return { modelos: ms, modal: null, form: null, toast: i >= 0 ? 'Producto actualizado' : 'Producto creado' };
    });
  }, [setState]);

  const guardarEntrada = useCallback(() => {
    setState((s) => {
      const e = s.entrada;
      const base = s.modelos.find((x) => x.ref === e.ref);
      const total = porTalla(base) ? Object.keys(e.tallas).reduce((a, k) => a + (Number(e.tallas[k]) || 0), 0) : Number(e.tallas.__u) || 0;
      if (!total) return { toast: 'Indica cuántas ' + unidadTxt(base) + ' entran' };
      const modelos = s.modelos.map((m) => {
        if (m.ref !== e.ref) return m;
        if (!porTalla(m)) return { ...m, stock: Number(m.stock || 0) + total };
        const tallas = { ...m.tallas };
        Object.keys(e.tallas).forEach((k) => { tallas[k] = Number(tallas[k] || 0) + (Number(e.tallas[k]) || 0); });
        return { ...m, tallas };
      });
      const m = s.modelos.find((x) => x.ref === e.ref);
      const detTallas = porTalla(m) ? Object.keys(e.tallas).filter((k) => Number(e.tallas[k]) > 0).map((k) => 'T' + k).join(', ') : total + ' ' + unidadTxt(m);
      const mov = { fecha: new Date().toISOString(), tipo: 'Entrada', modelo: m.ref + ' · ' + m.nombre, detalle: (e.proveedor || 'Proveedor sin nombre') + ' · ' + detTallas, quien: s.user, pares: total };
      return { modelos, movs: [mov].concat(s.movs), modal: null, entrada: null, toast: 'Entrada registrada · +' + total + ' ' + unidadTxt(m) };
    });
  }, [setState]);

  const guardarAjuste = useCallback(() => {
    setState((s) => {
      const a = s.ajuste;
      const m = s.modelos.find((x) => x.ref === a.ref);
      const porT = porTalla(m);
      const actual = porT ? Number(m.tallas[a.talla] || 0) : Number(m.stock || 0);
      const nuevo = Number(a.valor);
      if (isNaN(nuevo) || a.valor === '') return { toast: 'Escribe las ' + unidadTxt(m) + ' que contaste' };
      const modelos = s.modelos.map((x) => (x.ref !== a.ref ? x : porT ? { ...x, tallas: { ...x.tallas, [a.talla]: nuevo } } : { ...x, stock: nuevo }));
      const mov = { fecha: new Date().toISOString(), tipo: 'Ajuste', modelo: m.ref + ' · ' + m.nombre, detalle: a.motivo + ' · ' + (porT ? 'talla ' + a.talla : unidadTxt(m)) + ': ' + actual + ' → ' + nuevo, quien: s.user, pares: nuevo - actual };
      return { modelos, movs: [mov].concat(s.movs), modal: null, ajuste: null, toast: 'Ajuste guardado' };
    });
  }, [setState]);

  const login = useCallback((role, user, screen) => setState({ role, user, screen }), [setState]);
  const logout = useCallback(() => setState({ role: null, screen: 'panel', carrito: [], modal: null }), [setState]);

  const value = useMemo(() => ({
    state, setState, toast, setScreen, close,
    activos, stockTotal, archivar, addCarrito, cobrar, devolver,
    abrirModelo, guardarModelo, guardarEntrada, guardarAjuste,
    login, logout,
  }), [state, setState, toast, setScreen, close, activos, stockTotal, archivar, addCarrito, cobrar, devolver, abrirModelo, guardarModelo, guardarEntrada, guardarAjuste, login, logout]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>');
  return ctx;
}
