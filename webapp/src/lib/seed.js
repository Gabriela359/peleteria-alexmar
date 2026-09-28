// Catálogo y datos de demostración iniciales (primer arranque, sin datos guardados aún).
import { porTalla } from './format';

export const MODELOS_INICIALES = [
  { ref: 'SU-101', nombre: 'Suela Clásica Ranger', tipo: 'Suelas', unidad: 'par', color: 'Negro', precio: 28000, costo: 18500, min: 12, tallas: { '38': 24, '39': 30, '40': 28, '41': 22, '42': 16, '43': 9, '44': 6 } },
  { ref: 'SU-204', nombre: 'Suela Urbana Flex', tipo: 'Suelas', unidad: 'par', color: 'Café', precio: 34500, costo: 22000, min: 10, tallas: { '38': 14, '39': 18, '40': 20, '41': 12, '42': 8, '43': 5 } },
  { ref: 'SU-310', nombre: 'Suela Bota Andina', tipo: 'Suelas', unidad: 'par', color: 'Negro', precio: 41000, costo: 27000, min: 8, tallas: { '39': 10, '40': 12, '41': 9, '42': 7, '43': 4, '44': 3 } },
  { ref: 'SU-415', nombre: 'Suela Dama Confort', tipo: 'Suelas', unidad: 'par', color: 'Beige', precio: 26500, costo: 16000, min: 12, tallas: { '34': 16, '35': 22, '36': 26, '37': 20, '38': 14, '39': 8 } },
  { ref: 'SU-520', nombre: 'Suela Deportiva Air', tipo: 'Suelas', unidad: 'par', color: 'Blanco', precio: 38000, costo: 24500, min: 10, tallas: { '36': 6, '37': 9, '38': 11, '39': 13, '40': 10, '41': 7, '42': 4 } },
  { ref: 'SU-630', nombre: 'Suela Colegial Fuerte', tipo: 'Suelas', unidad: 'par', color: 'Negro', precio: 23000, costo: 14000, min: 15, tallas: { '32': 18, '33': 20, '34': 24, '35': 22, '36': 17, '37': 11 } },
  { ref: 'SU-712', nombre: 'Suela Trabajo Pesado', tipo: 'Suelas', unidad: 'par', color: 'Negro', precio: 45000, costo: 30000, min: 8, tallas: { '39': 8, '40': 11, '41': 10, '42': 8, '43': 5 } },
  { ref: 'PL-120', nombre: 'Plantilla Memory Foam', tipo: 'Plantillas', unidad: 'par', color: 'Gris', precio: 12000, costo: 6500, min: 20, tallas: { '35': 18, '36': 22, '37': 25, '38': 24, '39': 19, '40': 15, '41': 11 } },
  { ref: 'PL-240', nombre: 'Plantilla Cuero Natural', tipo: 'Plantillas', unidad: 'par', color: 'Miel', precio: 16500, costo: 9000, min: 15, tallas: { '36': 12, '37': 16, '38': 14, '39': 10, '40': 7 } },
  { ref: 'TC-310', nombre: 'Tacón Bloque 5 cm', tipo: 'Tacones', unidad: 'par', color: 'Negro', precio: 14500, costo: 8200, min: 12, tallas: { '35': 9, '36': 14, '37': 16, '38': 12, '39': 6 } },
  { ref: 'PG-010', nombre: 'Pegante amarillo x 1 galón', tipo: 'Pegantes', unidad: 'unidad', color: 'Ámbar', precio: 62000, costo: 44000, min: 6, stock: 14 },
  { ref: 'PG-025', nombre: 'Pegante blanco x 1/4', tipo: 'Pegantes', unidad: 'unidad', color: 'Blanco', precio: 19000, costo: 12500, min: 8, stock: 23 },
  { ref: 'HL-400', nombre: 'Hilo encerado 100 m', tipo: 'Hilos y adornos', unidad: 'unidad', color: 'Negro', precio: 8500, costo: 4600, min: 20, stock: 46 },
  { ref: 'HR-505', nombre: 'Hebilla metálica dorada', tipo: 'Herrajes', unidad: 'unidad', color: 'Dorado', precio: 3200, costo: 1500, min: 40, stock: 128 },
  { ref: 'CH-088', nombre: 'Cordón plano 120 cm', tipo: 'Cordones', unidad: 'unidad', color: 'Negro', precio: 4500, costo: 2100, min: 30, stock: 12 },
  { ref: 'HM-700', nombre: 'Lija para desbaste', tipo: 'Insumos', unidad: 'unidad', color: '—', precio: 5500, costo: 2800, min: 15, stock: 34 },
];

// PRNG determinístico (congruencial lineal) para que el histórico de demo sea
// siempre el mismo entre reinicios de un mismo `seed`.
function makeRnd(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function seedVentas(modelos) {
  const rnd = makeRnd(20260818);
  const ventas = [];
  const vendedores = ['Carlos Rueda', 'Yined Ortega', 'Ana Márquez'];
  const metodos = ['Efectivo', 'Transferencia', 'Tarjeta'];
  let n = 0;
  for (let d = 44; d >= 0; d--) {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    base.setDate(base.getDate() - d);
    if (base.getDay() === 0) continue;
    const cuantas = 2 + Math.floor(rnd() * 4);
    for (let k = 0; k < cuantas; k++) {
      const f = new Date(base);
      f.setHours(8 + Math.floor(rnd() * 10), Math.floor(rnd() * 60));
      const items = [];
      const cuantosItems = 1 + Math.floor(rnd() * 2);
      for (let i = 0; i < cuantosItems; i++) {
        const m = modelos[Math.floor(rnd() * modelos.length)];
        const tallas = m.tallas ? Object.keys(m.tallas) : [];
        const talla = tallas.length ? tallas[Math.floor(rnd() * tallas.length)] : null;
        const pares = 1 + Math.floor(rnd() * 5);
        items.push({ ref: m.ref, nombre: m.nombre, talla, unidad: m.unidad || 'par', pares, precio: m.precio, costo: m.costo });
      }
      n++;
      ventas.push({
        id: 'F-' + String(1000 + n),
        fecha: f.toISOString(),
        vendedor: vendedores[Math.floor(rnd() * 3)],
        metodo: metodos[Math.floor(rnd() * 3)],
        cliente: '',
        items,
        total: items.reduce((a, b) => a + b.pares * b.precio, 0),
        costo: items.reduce((a, b) => a + b.pares * b.costo, 0),
        devuelta: false,
      });
    }
  }
  return ventas;
}

export function seedMovs() {
  const hoy = new Date();
  const d = (n) => {
    const x = new Date(hoy);
    x.setDate(x.getDate() - n);
    return x.toISOString();
  };
  return [
    { fecha: d(1), tipo: 'Entrada', modelo: 'SU-101 · Clásica Ranger', detalle: 'Suelas del Oriente S.A.S. · tallas 39 a 42', quien: 'Ana Márquez', pares: 60 },
    { fecha: d(3), tipo: 'Ajuste', modelo: 'SU-520 · Deportiva Air', detalle: 'Conteo físico · faltaban pares', quien: 'Ana Márquez', pares: -3 },
    { fecha: d(6), tipo: 'Entrada', modelo: 'SU-415 · Dama Confort', detalle: 'Cauchos Andinos Ltda. · tallas 35 a 38', quien: 'Ana Márquez', pares: 48 },
    { fecha: d(9), tipo: 'Ajuste', modelo: 'SU-310 · Bota Andina', detalle: 'Rotura en bodega', quien: 'Ana Márquez', pares: -2 },
  ];
}

export function buildInitialState() {
  const modelos = MODELOS_INICIALES.map((m) => Object.assign({ archivado: false }, m));
  const ventas = seedVentas(modelos);
  return {
    modelos,
    ventas,
    seq: ventas.length,
    movs: seedMovs(),
    usuarios: [
      { nombre: 'Ana Márquez', correo: 'ana@elprogreso.co', rol: 'Administrador', activo: true },
      { nombre: 'Carlos Rueda', correo: 'carlos@elprogreso.co', rol: 'Vendedor', activo: true },
      { nombre: 'Yined Ortega', correo: 'yined@elprogreso.co', rol: 'Vendedor', activo: false },
    ],
    correos: ['gerencia@elprogreso.co', 'contabilidad@elprogreso.co'],
    hora: '19:00',
    tiposExtra: [],
    tiposOcultos: [],
  };
}

export { porTalla };
