import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { MetodoPago, VentaConItems } from '../types/database'

const KEY = ['ventas'] as const

// RLS ya limita esto a "todas" (admin) o "solo las mías" (vendedor).
// Para un volumen alto de facturas conviene paginar/filtrar por fecha en el
// servidor; se deja así porque encaja con el tamaño real de un local de barrio.
export function useVentas() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<VentaConItems[]> => {
      const { data, error } = await supabase
        .from('ventas')
        .select('*, venta_items(*)')
        .order('fecha', { ascending: false })
      if (error) throw error
      return data as VentaConItems[]
    },
  })
}

export interface ItemCarrito {
  ref: string
  talla: string | null
  pares: number
}

export function useRegistrarVenta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { items: ItemCarrito[]; metodo: MetodoPago; cliente: string | null }) => {
      const { data, error } = await supabase.rpc('registrar_venta', {
        p_items: args.items, p_metodo: args.metodo, p_cliente: args.cliente,
      })
      if (error) throw error
      return data as string // id de la factura creada
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['productos'] })
    },
  })
}

export function useRegistrarDevolucion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ventaId: string) => {
      const { error } = await supabase.rpc('registrar_devolucion', { p_venta_id: ventaId })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['productos'] })
      qc.invalidateQueries({ queryKey: ['movimientos'] })
    },
  })
}
