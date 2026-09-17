import { useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCircleInfo,
  faRotateLeft,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'

type Props = {
  open: boolean
  onClose: () => void
  onReset: () => void
}

export function InstructionsModal({ open, onClose, onReset }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="instrucciones-titulo"
        className="w-full max-w-lg rounded-xl border border-brand-border bg-cell p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2
            id="instrucciones-titulo"
            className="font-display inline-flex items-center gap-2 text-xl font-semibold text-brand-on-surface"
          >
            <FontAwesomeIcon icon={faCircleInfo} />
            Instrucciones de captura
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-md text-ink-muted hover:bg-brand-soft"
            aria-label="Cerrar"
          >
            <FontAwesomeIcon icon={faXmark} className="text-lg" />
          </button>
        </div>
        <ul className="list-disc space-y-2.5 pl-5 text-[0.95rem] leading-relaxed text-ink">
          <li>
            Complete las celdas blancas. El total y el saldo se calculan
            automáticamente en dólares.
          </li>
          <li>Los pagos se registran únicamente mediante su fecha.</li>
          <li>
            Si dos parcialidades se pagan juntas, registre la misma fecha en
            ambas columnas.
          </li>
          <li>
            Para una baja, seleccione <strong>Baja - gestionar devolución</strong>
            ; la fila se marcará en rojo y deberá explicarse el caso en
            Observaciones.
          </li>
          <li>
            Arrastre el borde derecho de cada encabezado de columna para
            cambiar su ancho.
          </li>
          <li>
            Los títulos de grupo (Identidad, Pagos, etc.) siempre están visibles:
            el nombre lleva a esa sección; el icono de chevron la oculta o
            muestra.
          </li>
        </ul>
        <button
          type="button"
          onClick={onReset}
          className="mt-5 inline-flex items-center gap-2 rounded-lg border border-brand-border px-4 py-2 text-[0.95rem] font-semibold text-brand-on-surface hover:bg-brand-soft"
        >
          <FontAwesomeIcon icon={faRotateLeft} />
          Restaurar ejemplos
        </button>
      </div>
    </div>
  )
}
