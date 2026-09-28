import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { TipoProducto } from '../types/database'

const KEY = ['tipos_producto'] as const

export function useTiposProducto() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<TipoProducto[]> => {
      const { data, error } = await supabase.from('tipos_producto').select('*').order('nombre')
      if (error) throw error
      return data
    },
  })
}

export function useAgregarTipo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (nombre: string) => {
      const { error } = await supabase
        .from('tipos_producto')
        .upsert({ nombre, con_talla: false, activo: true }, { onConflict: 'nombre' })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useOcultarTipo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ nombre, ocultar }: { nombre: string; ocultar: boolean }) => {
      const { error } = await supabase.rpc('ocultar_tipo_producto', { p_nombre: nombre, p_ocultar: ocultar })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
