import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Caja } from '../types/database'

const KEY = ['cajas'] as const

// Ordenado por id desc para mostrar primero las cajas más recientes.
// Los consumidores determinan la caja actual comparando la fecha operativa.
export function useCajas() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<Caja[]> => {
      const { data, error } = await supabase.from('cajas').select('*').order('id', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useAbrirCaja() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (fondoInicial: number) => {
      const { data, error } = await supabase.rpc('abrir_caja', { p_fondo_inicial: fondoInicial })
      if (error) throw error
      return data as Caja
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useCerrarCaja() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (efectivoContado: number) => {
      const { data, error } = await supabase.rpc('cerrar_caja', { p_efectivo_contado: efectivoContado })
      if (error) throw error
      return data as Caja
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
