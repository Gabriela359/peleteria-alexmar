import { createClient } from '@supabase/supabase-js'
import { logger } from './logger'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  logger.error('SUPABASE', 'Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copia .env.example a .env.local y completa con los datos de tu proyecto de Supabase.')
}

// Nota sobre tipos: no pasamos el genérico <Database> a createClient aquí.
// La versión de supabase-js instalada tiene una inferencia de tipos muy
// estricta (requiere la forma EXACTA que genera `supabase gen types`, con
// detalles internos no documentados) y pelear con eso a mano, sin un
// proyecto real contra el cual generar los tipos, da más trabajo que
// beneficio. En su lugar, cada hook en src/hooks/*.ts anota a mano el tipo
// de retorno de sus queries (usando src/types/database.ts) y los payloads de
// las funciones RPC, así que el resto de la app sigue estando tipado.
// Cuando tengas un proyecto de Supabase real, corre:
//   npx supabase gen types typescript --project-id TU-PROYECTO > src/types/database.generated.ts
// y pasa ese tipo generado como <Database> aquí para recuperar el tipado
// estricto de extremo a extremo.
export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
})
