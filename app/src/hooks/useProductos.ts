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
    mutationFn: async (p: ProductoForm) => {
      const { error } = await supabase.from('productos').upsert(p, { onConflict: 'ref' })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useEliminarProducto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ref: string) => {
      const { error } = await supabase.from('productos').delete().eq('ref', ref)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
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
    mutationFn: async (args: { ref: string; tallas: Record<string, number>; proveedor: string | null }) => {
      const { error } = await supabase.rpc('registrar_entrada', {
        p_ref: args.ref, p_tallas: args.tallas, p_proveedor: args.proveedor,
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
    mutationFn: async (args: { ref: string; talla: string | null; valor: number; motivo: string }) => {
      const { error } = await supabase.rpc('registrar_ajuste', {
        p_ref: args.ref, p_talla: args.talla, p_valor: args.valor, p_motivo: args.motivo,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['movimientos'] })
    },
  })
}

export function useSubirFotoProducto() {
  return useMutation({
    mutationFn: async ({ ref, file }: { ref: string; file: File }) => {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${ref}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('productos').upload(path, file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('productos').getPublicUrl(path)
      return data.publicUrl
    },
  })
}
