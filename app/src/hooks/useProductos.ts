import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Producto } from '../types/database'

const KEY = ['productos'] as const

export function useProductos() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<Producto[]> => {
      const { data, error } = await supabase.from('productos').select('*').order('ref')
      if (error) throw error
      return data
    },
  })
}

export type ProductoForm = Omit<Producto, 'created_at' | 'updated_at'>

export function useGuardarProducto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: Pick<Producto, 'ref' | 'nombre' | 'color' | 'precio' | 'costo' | 'min'>) => {
      const { error } = await supabase.from('productos').update({
        nombre: p.nombre,
        color: p.color,
        precio: p.precio,
        costo: p.costo,
        min: p.min,
      }).eq('ref', p.ref)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useCrearProducto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: Omit<ProductoForm, 'archivado' | 'unidad'>) => {
      const { error } = await supabase.rpc('crear_producto', {
        p_ref: p.ref,
        p_nombre: p.nombre,
        p_color: p.color,
        p_precio: p.precio,
        p_costo: p.costo,
        p_min: p.min,
        p_modo_stock: p.modo_stock,
        p_tallas: p.tallas,
        p_stock: p.stock,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['movimientos'] })
    },
  })
}

export function useEliminarProducto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ref: string) => {
      const { error } = await supabase.rpc('eliminar_producto', { p_ref: ref })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['movimientos'] })
      qc.invalidateQueries({ queryKey: ['ventas'] })
    },
  })
}

export function useArchivarProducto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ ref, archivado }: { ref: string; archivado: boolean }) => {
      const { error } = await supabase.rpc('archivar_producto', { p_ref: ref, p_archivado: archivado })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['movimientos'] })
    },
  })
}

export function useRegistrarEntrada() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { ref: string; modo_stock: 'total' | 'talla'; tallas: Record<string, number>; stock: number; proveedor: string | null }) => {
      const { error } = await supabase.rpc('registrar_entrada', {
        p_ref: args.ref, p_modo_stock: args.modo_stock, p_tallas: args.tallas, p_stock: args.stock, p_proveedor: args.proveedor,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['movimientos'] })
    },
  })
}

export function useRegistrarAjuste() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { ref: string; modo_stock: 'total' | 'talla'; tallas: Record<string, number>; stock: number; talla: string | null; valor: number; motivo: string }) => {
      const { error } = await supabase.rpc('registrar_ajuste', {
        p_ref: args.ref,
        p_modo_stock: args.modo_stock,
        p_tallas: args.tallas,
        p_stock: args.stock,
        p_talla: args.talla,
        p_valor: args.valor,
        p_motivo: args.motivo,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['movimientos'] })
    },
  })
}
