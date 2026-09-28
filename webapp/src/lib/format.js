// Formato de moneda, fechas y textos compartidos por toda la app.

export function cop(n) {
  return '$ ' + Math.round(n || 0).toLocaleString('es-CO');
}

export function fecha(iso) {
  const d = new Date(iso);
  return (
    String(d.getDate()).padStart(2, '0') + '/' +
    String(d.getMonth() + 1).padStart(2, '0') + '/' +
    d.getFullYear()
  );
}

export function hhmm(iso) {
  const d = new Date(iso);
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

export function esHoy(iso) {
  const d = new Date(iso), h = new Date();
  return d.toDateString() === h.toDateString();
}

export function hoyLargo() {
  const s = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Un modelo se vende "por talla" (en pares) salvo que su unidad sea 'unidad'.
export function porTalla(m) {
  return m.unidad !== 'unidad';
}
export function unidadTxt(m) {
  return porTalla(m) ? 'pares' : 'unidades';
}
export function unidadSing(m) {
  return porTalla(m) ? 'par' : 'unidad';
}
export function paresDe(m) {
  return porTalla(m)
    ? Object.keys(m.tallas || {}).reduce((a, k) => a + Number(m.tallas[k] || 0), 0)
    : Number(m.stock || 0);
}

export function detalle(v) {
  return v.items.map((i) => i.nombre + (i.talla ? ' T' + i.talla : '') + ' ×' + i.pares).join(' · ');
}

// Rango del periodo actual + su periodo anterior equivalente, para comparar deltas.
export function rango(periodo) {
  const hoy = new Date();
  hoy.setHours(23, 59, 59, 999);
  const dias = periodo === 'dia' ? 1 : periodo === 'semana' ? 7 : 30;
  const desde = new Date(hoy);
  desde.setDate(desde.getDate() - (dias - 1));
  desde.setHours(0, 0, 0, 0);
  const desdePrev = new Date(desde);
  desdePrev.setDate(desdePrev.getDate() - dias);
  const hastaPrev = new Date(desde);
  hastaPrev.setMilliseconds(-1);
  return { desde, hasta: hoy, desdePrev, hastaPrev, dias };
}

export function entre(v, a, b) {
  const d = new Date(v.fecha);
  return d >= a && d <= b && !v.devuelta;
}

export function agg(list) {
  return {
    total: list.reduce((a, v) => a + v.total, 0),
    pares: list.reduce((a, v) => a + v.items.reduce((x, i) => x + i.pares, 0), 0),
    util: list.reduce((a, v) => a + (v.total - v.costo), 0),
    n: list.length,
  };
}

export function delta(a, b) {
  if (!b) return { txt: a > 0 ? 'Sin dato del periodo anterior' : 'Sin movimiento', color: 'var(--gris-350)' };
  const p = Math.round(((a - b) / b) * 100);
  return { txt: (p >= 0 ? '▲ ' : '▼ ') + Math.abs(p) + '% vs. periodo anterior', color: p >= 0 ? 'var(--success-1)' : 'var(--danger-1)' };
}

// Info de paginación: números a mostrar (con "…"), rango "Mostrando X–Y de Z", etc.
export function pager(total, porPag, actual) {
  const paginas = Math.max(1, Math.ceil(total / porPag));
  const p = Math.min(Math.max(1, actual), paginas);
  const nums = [];
  for (let i = 1; i <= paginas; i++) {
    if (paginas <= 7 || i === 1 || i === paginas || Math.abs(i - p) <= 1) nums.push(i);
    else if (nums[nums.length - 1] !== '…') nums.push('…');
  }
  const desde = total === 0 ? 0 : (p - 1) * porPag + 1;
  const hasta = Math.min(p * porPag, total);
  return {
    pagina: p,
    desde,
    hasta,
    texto: total === 0 ? 'Sin registros' : 'Mostrando ' + desde + '–' + hasta + ' de ' + total,
    paginas: nums,
    hayPrev: p > 1,
    hayNext: p < paginas,
  };
}
