import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Movimiento } from '../types/database'

export function useMovimientos() {
  return useQuery({
    queryKey: ['movimientos'],
    queryFn: async (): Promise<Movimiento[]> => {
      const { data, error } = await supabase.from('movimientos').select('*').order('fecha', { ascending: false })
      if (error) throw error
      return data
    },
  })
}
