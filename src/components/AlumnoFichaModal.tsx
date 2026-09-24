import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFilePdf, faXmark } from '@fortawesome/free-solid-svg-icons'
import { useState, type ReactNode } from 'react'
import {
  PAGO_1_USD,
  PAGO_2_USD,
  PAGO_3_USD,
  formatUsd,
} from '../lib/constants'
import { generateAndDownloadCarta } from '../lib/generateCartaBienvenida'
import {
  etiquetaExpediente,
  estatusPago,
  saldo,
  totalPagado,
} from '../lib/pagos'
import { type Alumno } from '../types/alumno'
import { StatusMark } from './StatusMark'

type Props = {
  alumno: Alumno | null
  open: boolean
  onClose: () => void
}

function Section({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="border-b border-brand-border last:border-b-0">
      <h3 className="bg-[#0d0e13] px-4 py-2 font-display text-[0.7rem] font-semibold tracking-[0.14em] text-gold uppercase sm:px-5">
        {title}
      </h3>
      <div className="grid gap-0 sm:grid-cols-2 ">{children}</div>
    </section>
  )
}

function Row({
  label,
  children,
  wide,
}: {
  label: string
  children: ReactNode
  wide?: boolean
}) {
  return (
    <div
      className={`flex flex-col gap-1.5 border-b border-brand-border/50 px-4 py-3 sm:px-5 ${
        wide ? 'sm:col-span-2' : ''
      }`}
    >
      <span className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
        {label}
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function ReadValue({ value }: { value: string }) {
  return <p className="text-sm text-ink">{value.trim() || '—'}</p>
}

export function AlumnoFichaModal({ alumno, open, onClose }: Props) {
  const [pdfBusy, setPdfBusy] = useState(false)
  if (!open || !alumno) return null

  const showDevolucion =
    alumno.estado !== 'Activo' || alumno.devolucionSolicitada === 'Si'

  const pagado1 = Boolean(alumno.fechaPago1?.trim())
  const pagado2 = Boolean(alumno.fechaPago2?.trim())
  const pagado3 = Boolean(alumno.fechaPago3?.trim())

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-[2px] sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ficha-titulo"
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-brand-border bg-cell shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-brand-border bg-brand px-4 py-4 text-on-brand sm:px-5">
          <div className="min-w-0 flex-1">
            <h2
              id="ficha-titulo"
              className="font-display truncate text-xl leading-tight font-bold tracking-tight text-gold sm:text-2xl"
            >
              {alumno.nombreCompleto || 'Sin nombre'}
            </h2>
            <p className="mt-0.5 text-[0.7rem] font-semibold tracking-[0.14em] text-on-brand/80 uppercase sm:mt-1 sm:text-sm sm:tracking-[0.18em]">
              Ficha · Folio {alumno.folio || '—'}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-on-brand/90">
              <StatusMark
                done={pagado1}
                pending={!pagado1}
                doneTone="blue"
                title={alumno.fechaPago1 || 'Pago 1 pendiente'}
              />
              <StatusMark
                done={pagado2}
                pending={!pagado2}
                doneTone="blue"
                title={alumno.fechaPago2 || 'Pago 2 pendiente'}
              />
              <StatusMark
                done={pagado3}
                pending={!pagado3}
                doneTone="blue"
                title={alumno.fechaPago3 || 'Pago 3 pendiente'}
              />
              <span className="ml-0.5">{estatusPago(alumno)}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              disabled={!alumno.nombreCompleto?.trim() || pdfBusy}
              title="Descargar carta PDF"
              aria-label={pdfBusy ? 'Generando PDF' : 'Descargar carta PDF'}
              onClick={() => {
                void (async () => {
                  setPdfBusy(true)
                  try {
                    await generateAndDownloadCarta(alumno)
                  } finally {
                    setPdfBusy(false)
                  }
                })()
              }}
              className="inline-flex size-11 items-center justify-center rounded-full bg-white/5 text-on-brand transition-[background-color,opacity] duration-150 hover:bg-white/15 disabled:opacity-40"
            >
              <FontAwesomeIcon icon={faFilePdf} aria-hidden />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex size-11 items-center justify-center rounded-full bg-white/5 text-on-brand transition-[background-color] duration-150 hover:bg-white/15"
              aria-label="Cerrar"
            >
              <FontAwesomeIcon icon={faXmark} className="text-lg" aria-hidden />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <Section title="Identidad">
            <Row label="Ref">
              <ReadValue value={alumno.alumnoRef} />
            </Row>
            <Row label="Nivel">
              <ReadValue value={alumno.nivel} />
            </Row>
            <Row label="Grado">
              <ReadValue value={alumno.grado} />
            </Row>
            <Row label="Estado">
              <ReadValue value={alumno.estado} />
            </Row>
          </Section>

          <Section title="Datos personales">
            <Row label="Nombre completo" wide>
              <ReadValue value={alumno.nombreCompleto} />
            </Row>
            <Row label="CURP">
              <ReadValue value={alumno.curp} />
            </Row>
            <Row label="Nacimiento">
              <ReadValue value={alumno.fechaNacimiento} />
            </Row>
            <Row label="Correo tutor">
              <ReadValue value={alumno.correoTutor} />
            </Row>
            <Row label="Incorporación">
              <ReadValue value={alumno.tipoIncorporacion} />
            </Row>
          </Section>

          <Section title="Pagos">
            <Row label={`Pago 1 · ${formatUsd(PAGO_1_USD)}`}>
              <ReadValue value={alumno.fechaPago1} />
            </Row>
            <Row label={`Pago 2 · ${formatUsd(PAGO_2_USD)}`}>
              <ReadValue value={alumno.fechaPago2} />
            </Row>
            <Row label={`Pago 3 · ${formatUsd(PAGO_3_USD)}`}>
              <ReadValue value={alumno.fechaPago3} />
            </Row>
            <Row label="Total">
              <ReadValue value={formatUsd(totalPagado(alumno))} />
            </Row>
            <Row label="Saldo">
              <ReadValue value={formatUsd(saldo(alumno))} />
            </Row>
            <Row label="Estatus">
              <ReadValue value={estatusPago(alumno)} />
            </Row>
          </Section>

          <Section title="Expediente">
            <Row label="Correo bienvenida">
              <ReadValue value={alumno.fechaCorreoBienvenida} />
            </Row>
            <Row label="Carpeta Drive">
              <ReadValue value={alumno.carpetaDrive} />
            </Row>
            <Row label="CURP Drive">
              <ReadValue value={alumno.curpDrive} />
            </Row>
            <Row label="Boletas Drive">
              <ReadValue value={alumno.boletasDrive} />
            </Row>
            <Row label="Expediente documental">
              <ReadValue value={etiquetaExpediente(alumno)} />
            </Row>
            <Row label="Autorización CE">
              <ReadValue value={alumno.autorizacionControlEscolar} />
            </Row>
            <Row label="Validación archivo">
              <ReadValue value={alumno.validacionArchivoFinal} />
            </Row>
            <Row label="Fecha archivo final">
              <ReadValue value={alumno.fechaInclusionArchivoFinal} />
            </Row>
          </Section>

          <Section title="Devoluciones">
            {showDevolucion ? (
              <>
                <Row label="Devolución solicitada">
                  <ReadValue value={alumno.devolucionSolicitada} />
                </Row>
                <Row label="Fecha devolución">
                  <ReadValue value={alumno.fechaDevolucion} />
                </Row>
                <Row label="Observaciones" wide>
                  <ReadValue value={alumno.observaciones} />
                </Row>
              </>
            ) : (
              <div className="px-4 py-4 text-sm text-ink-muted sm:col-span-2 sm:px-5">
                Alumno activo sin solicitud de devolución.
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  )
}
