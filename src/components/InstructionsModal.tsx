import { useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleInfo, faXmark } from '@fortawesome/free-solid-svg-icons'

type Props = {
  open: boolean
  onClose: () => void
}

export function InstructionsModal({ open, onClose }: Props) {
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
        className="max-h-[min(90dvh,40rem)] w-full max-w-lg overflow-y-auto rounded-xl border border-brand-border bg-cell p-4 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2
            id="instrucciones-titulo"
            className="font-display inline-flex items-center gap-2 text-xl font-semibold text-white/90"
          >
            <FontAwesomeIcon icon={faCircleInfo} />
            Cómo usar el panel
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

        <div className="space-y-5 text-[0.95rem] leading-relaxed text-ink">
          <section>
            <h3 className="mb-2 text-xs font-semibold tracking-[0.12em] text-ink-muted uppercase">
              Flujo
            </h3>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                La tabla es un <strong>checklist operativo</strong>: secciones
                Alumno → Pagos → Drive → Cierre. Sirve para ver el avance de un
                vistazo.
              </li>
              <li>
                Use el botón de <strong>sincronizar</strong> (header) para traer
                alumnos y fechas de pago desde Winston. Con el 1.er pago nuevo se
                prepara el envío de la carta de bienvenida al tutor.
              </li>
              <li>
                Abra la <strong>Ficha</strong> para consultar datos completos
                (identidad, totales, expediente, devoluciones). La ficha es de
                consulta; la captura operativa vive en la tabla.
              </li>
              <li>
                Marque a mano Drive, Autorización CE y Validación final cuando
                cada paso esté hecho. Cambie el <strong>Estado</strong> si hay
                baja o reembolso.
              </li>
            </ol>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold tracking-[0.12em] text-ink-muted uppercase">
              Automático
            </h3>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Alta / pagos:</strong> folio, alumno y fechas de pago
                (USD $100 / $125 / $125) llegan con la sincronización desde
                Winston. No se capturan fechas a mano en la tabla.
              </li>
              <li>
                <strong>Identidad:</strong> nombre, nivel, grado, CURP, correo
                tutor, etc. se leen en vivo desde la ficha Winston (no se
                editan aquí).
              </li>
              <li>
                <strong>Cálculos:</strong> total pagado, saldo, estatus de pago
                y etiqueta de expediente se derivan solos.
              </li>
              <li>
                <strong>Carta de bienvenida:</strong> tras sincronizar, si hay
                1.er pago nuevo se envía el correo al tutor (contenido de
                producción).
              </li>
              <li>
                <strong>Filtros y chips:</strong> cuentan y filtran según estado
                y pagos ya registrados.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold tracking-[0.12em] text-ink-muted uppercase">
              Manual
            </h3>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Estado</strong> del alumno (Activo / Baja / Reembolso).
                En baja, documente el caso en Observaciones (ficha).
              </li>
              <li>
                <strong>Drive:</strong> Carpeta, CURP y Boletas (marque cuando
                estén en Drive).
              </li>
              <li>
                <strong>Cierre:</strong> Autorización CE y Validación final
                (marque cuando Control Escolar y el archivo estén listos).
              </li>
              <li>
                Ancho de columnas: arrastre el borde derecho del encabezado si
                necesita más espacio.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
