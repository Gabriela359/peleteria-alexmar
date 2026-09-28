// Tipos escritos a mano que reflejan supabase/migrations/*.sql.
// Si más adelante corres `supabase gen types typescript`, este archivo
// se puede reemplazar por el generado sin tocar el resto del código
// (todo consume estos mismos nombres: Producto, Venta, etc.).

export type Rol = 'admin' | 'vendedor'
export type Unidad = 'par' | 'unidad'
export type MetodoPago = 'Efectivo' | 'Transferencia'
export type MovimientoTipo = 'entrada' | 'ajuste' | 'devolucion' | 'archivado' | 'reactivado'
export type EstadoCaja = 'abierta' | 'cerrada'

export interface Profile {
  id: string
  nombre: string
  correo: string
  rol: Rol
  activo: boolean
  created_at: string
}

export interface TipoProducto {
  id: string
  nombre: string
  con_talla: boolean
  activo: boolean
  created_at: string
}

export interface Producto {
  ref: string
  nombre: string
  tipo: string
  unidad: Unidad
  color: string | null
  precio: number
  costo: number
  min: number
  tallas: Record<string, number>
  stock: number
  foto_url: string | null
  archivado: boolean
  created_at: string
  updated_at: string
}

export interface Venta {
  id: string
  fecha: string
  vendedor_id: string
  vendedor_nombre: string
  metodo: MetodoPago
  cliente: string | null
  total: number
  costo: number
  devuelta: boolean
  created_at: string
}

export interface VentaItem {
  id: number
  venta_id: string
  ref: string
  nombre: string
  talla: string | null
  unidad: Unidad
  pares: number
  precio: number
  costo: number
}

export type VentaConItems = Venta & { venta_items: VentaItem[] }

export interface Movimiento {
  id: number
  fecha: string
  tipo: MovimientoTipo
  producto_ref: string | null
  modelo: string
  detalle: string
  quien: string
  pares: number
}

export interface Caja {
  id: number
  fecha: string
  estado: EstadoCaja
  fondo_inicial: number
  abierta_por: string
  abierta_por_nombre: string
  abierta_en: string
  cerrada_por: string | null
  cerrada_por_nombre: string | null
  cerrada_en: string | null
  total_efectivo: number | null
  total_transferencia: number | null
  total_ventas: number | null
  efectivo_esperado: number | null
  efectivo_contado: number | null
  diferencia: number | null
}

export interface DestinatarioCorreo {
  id: number
  email: string
  created_at: string
}

export interface Configuracion {
  id: 1
  hora_envio: string
}

export interface EnvioCorreo {
  id: number
  fecha: string
  total: number
  pares: number
  destinatarios: string[]
  storage_path: string | null
}

type TableDef<Row, Insert, Update = Partial<Insert>> = { Row: Row; Insert: Insert; Update: Update; Relationships: [] }

export interface Database {
  public: {
    Tables: {
      profiles: TableDef<Profile, Omit<Profile, 'created_at'>, Partial<Pick<Profile, 'nombre' | 'rol' | 'activo'>>>
      tipos_producto: TableDef<TipoProducto, Omit<TipoProducto, 'id' | 'created_at'>>
      productos: TableDef<Producto, Omit<Producto, 'created_at' | 'updated_at'>>
      ventas: TableDef<Venta, Omit<Venta, 'created_at'>>
      venta_items: TableDef<VentaItem, Omit<VentaItem, 'id'>>
      movimientos: TableDef<Movimiento, Omit<Movimiento, 'id' | 'fecha'>>
      cajas: TableDef<Caja, Omit<Caja, 'id'>>
      destinatarios_correo: TableDef<DestinatarioCorreo, Pick<DestinatarioCorreo, 'email'>>
      configuracion: TableDef<Configuracion, Configuracion>
      envios_correo: TableDef<EnvioCorreo, Omit<EnvioCorreo, 'id' | 'fecha'>>
    }
    Views: Record<string, never>
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean }
      registrar_venta: {
        Args: { p_items: { ref: string; talla: string | null; pares: number }[]; p_metodo: MetodoPago; p_cliente: string | null }
        Returns: string
      }
      registrar_devolucion: { Args: { p_venta_id: string }; Returns: void }
      registrar_entrada: {
        Args: { p_ref: string; p_tallas: Record<string, number>; p_proveedor: string | null }
        Returns: void
      }
      registrar_ajuste: {
        Args: { p_ref: string; p_talla: string | null; p_valor: number; p_motivo: string }
        Returns: void
      }
      archivar_producto: { Args: { p_ref: string; p_archivado: boolean }; Returns: void }
      ocultar_tipo_producto: { Args: { p_nombre: string; p_ocultar: boolean }; Returns: void }
      abrir_caja: { Args: { p_fondo_inicial: number }; Returns: Caja }
      cerrar_caja: { Args: { p_efectivo_contado: number }; Returns: Caja }
    }
  }
}
