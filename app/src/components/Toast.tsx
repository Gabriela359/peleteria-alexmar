import { useUI } from '../state/ui'

export default function Toast() {
  const { toast } = useUI()
  if (!toast) return null
  return (
    <div className="fixed right-7 bottom-7 left-4 sm:left-auto z-[120] bg-sura-azul-oscuro text-sura-blanco px-5 py-3.5 rounded-xl text-sm font-bold shadow-2xl text-center sm:text-left">
      {toast}
    </div>
  )
}
