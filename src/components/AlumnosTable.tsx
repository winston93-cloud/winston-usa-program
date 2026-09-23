import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUpRightFromSquare, faIdCard } from '@fortawesome/free-solid-svg-icons'
import { PAGO_1_USD, PAGO_2_USD, PAGO_3_USD } from '../lib/constants'
import {
  etiquetaExpediente,
} from '../lib/pagos'
import {
  COLUMN_GROUP_BY_ID,
  DEFAULT_COL_WEIGHTS,
  GROUP_STYLES,
  STICKY_COLUMN_IDS,
  TABLE_COLUMNS,
  TABLE_INLINE_COLUMN_IDS,
  distributeWidths,
  isDriveColumn,
  isPagoColumn,
  sectionSpansFor,
  type ColumnId,
  type GroupId,
} from '../lib/tableColumns'
import {
  ESTADOS,
  type Alumno,
  type AlumnoPatch,
  type EstadoAlumno,
} from '../types/alumno'
import { AlumnoFichaModal } from './AlumnoFichaModal'
import { StatusMark } from './StatusMark'

const readClass = 'truncate px-0.5 py-1 text-sm text-ink'
const badgeClass =
  'inline-flex max-w-full truncate rounded-full bg-brand/10 px-2.5 py-1 text-sm text-ink'

const PAGO_SUBTITLE_USD: Partial<Record<ColumnId, number>> = {
  pago1: PAGO_1_USD,
  pago2: PAGO_2_USD,
  pago3: PAGO_3_USD,
}

/** Carpeta Drive del programa USA (band Drive → abrir en nueva pestaña). */
const DRIVE_PROGRAMA_URL =
  'https://drive.google.com/drive/folders/REEMPLAZAR_ID_CARPETA'

function cellTone(_estado: EstadoAlumno, groupId: GroupId | null): string {
  if (!groupId) return GROUP_STYLES.identidad.cell
  return GROUP_STYLES[groupId].cell
}

function ReadCell({
  children,
  title,
  align = 'center',
}: {
  children: ReactNode
  title?: string
  align?: 'left' | 'center'
}) {
  return (
    <div
      className={`${readClass} ${align === 'center' ? 'text-center' : 'text-left'}`}
      title={title}
    >
      {children || '—'}
    </div>
  )
}

function BadgeCell({
  children,
  title,
  tone = 'bg-white/10 text-ink',
  align = 'center',
}: {
  children: ReactNode
  title?: string
  tone?: string
  align?: 'left' | 'center'
}) {
  const text = children == null || children === '' ? '—' : children
  return (
    <div
      className={`flex min-w-0 items-center ${align === 'center' ? 'justify-center' : 'justify-start'}`}
    >
      <span className={`${badgeClass} ${tone}`} title={title}>
        {text}
      </span>
    </div>
  )
}

function AlumnoCell({
  colId,
  alumno,
  onChange,
  editable,
  onOpenFicha,
}: {
  colId: ColumnId
  alumno: Alumno
  onChange: (id: string, patch: AlumnoPatch) => void
  editable: boolean
  onOpenFicha: () => void
}) {
  const patch = (next: AlumnoPatch) => {
    if (!editable) return
    onChange(alumno.id, next)
  }

  const toggleSn = (
    key:
      | 'carpetaDrive'
      | 'curpDrive'
      | 'boletasDrive'
      | 'autorizacionControlEscolar'
      | 'validacionArchivoFinal',
    current: string,
  ) => {
    const nextVal = current === 'Si' ? 'No' : 'Si'
    if (
      key === 'carpetaDrive' ||
      key === 'curpDrive' ||
      key === 'boletasDrive'
    ) {
      const nextAlumno = { ...alumno, [key]: nextVal }
      patch({
        [key]: nextVal,
        expedienteDocumental: etiquetaExpediente(nextAlumno),
      })
      return
    }
    patch({ [key]: nextVal })
  }

  const snMark = (
    done: boolean,
    title: string,
    onToggle?: () => void,
    opts?: {
      alert?: boolean
      label?: string
      variant?: 'mark' | 'tile'
      tileIcon?: 'check' | 'stamp'
      doneTone?: 'green' | 'blue'
    },
  ) => (
    <div className="flex h-full min-h-9 w-full items-center justify-center">
      <StatusMark
        done={done}
        pending={!done && !opts?.alert}
        alert={opts?.alert}
        variant={opts?.variant ?? 'tile'}
        label={opts?.label}
        tileIcon={opts?.tileIcon}
        doneTone={opts?.doneTone}
        title={title}
        disabled={!editable || !onToggle}
        onClick={editable && onToggle ? onToggle : undefined}
      />
    </div>
  )

  if (colId === 'ficha') {
    return (
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onOpenFicha}
          title="Abrir ficha completa"
          aria-label={`Ficha de ${alumno.nombreCompleto || alumno.folio}`}
          className="inline-flex size-8 items-center justify-center rounded-md border border-brand-border bg-cell text-brand-accent hover:bg-brand-soft"
        >
          <FontAwesomeIcon icon={faIdCard} className="text-sm text-white" />
        </button>
      </div>
    )
  }

  switch (colId) {
    case 'folio':
      return <ReadCell>{alumno.folio}</ReadCell>
    case 'nombre':
      return <ReadCell>{alumno.nombreCompleto}</ReadCell>
    case 'estado': {
      const short =
        alumno.estado === 'Baja - gestionar devolución'
          ? 'Baja'
          : alumno.estado === 'Reembolso Realizado'
            ? 'Reembolsado'
            : 'Activo'
      const tone =
        alumno.estado === 'Baja - gestionar devolución'
          ? 'border-mark-red bg-mark-red text-mark-on'
          : alumno.estado === 'Reembolso Realizado'
            ? 'border-mark-gray bg-mark-gray text-mark-on'
            : 'border-mark-green bg-mark-green text-mark-on'
      if (!editable) {
        return (
          <BadgeCell tone={tone} title={alumno.estado}>
            {short}
          </BadgeCell>
        )
      }
      return (
        <select
          value={alumno.estado}
          title={alumno.estado}
          aria-label="Estado del alumno"
          onChange={(e) =>
            patch({ estado: e.target.value as EstadoAlumno })
          }
          className={`box-border w-full min-w-0 truncate rounded-md border px-1 py-1 text-center text-xs outline-none focus:ring-1 focus:ring-white ${tone}`}
        >
          {ESTADOS.map((opt) => (
            <option key={opt} value={opt}>
              {opt === 'Baja - gestionar devolución'
                ? 'Baja'
                : opt === 'Reembolso Realizado'
                  ? 'Reembolsado'
                  : 'Activo'}
            </option>
          ))}
        </select>
      )
    }
    case 'pago1':
    case 'pago2':
    case 'pago3': {
      const fecha =
        colId === 'pago1'
          ? alumno.fechaPago1
          : colId === 'pago2'
            ? alumno.fechaPago2
            : alumno.fechaPago3
      const n = colId === 'pago1' ? 1 : colId === 'pago2' ? 2 : 3
      const pagado = Boolean(fecha?.trim())
      return (
        <div className="flex h-full min-h-9 w-full items-center justify-center">
          <StatusMark
            done={pagado}
            pending={!pagado}
            variant="mark"
            doneTone="blue"
            title={pagado ? `Pago ${n} · ${fecha}` : `Pago ${n} pendiente`}
          />
        </div>
      )
    }
    case 'carpeta':
      return snMark(
        alumno.carpetaDrive === 'Si',
        alumno.carpetaDrive === 'Si'
          ? 'Carpeta creada en Drive'
          : 'Carpeta pendiente',
        () => toggleSn('carpetaDrive', alumno.carpetaDrive),
      )
    case 'curpDrive':
      return snMark(
        alumno.curpDrive === 'Si',
        alumno.curpDrive === 'Si' ? 'CURP en Drive' : 'CURP pendiente en Drive',
        () => toggleSn('curpDrive', alumno.curpDrive),
      )
    case 'boletas':
      return snMark(
        alumno.boletasDrive === 'Si',
        alumno.boletasDrive === 'Si'
          ? 'Boletas en Drive'
          : 'Boletas pendientes en Drive',
        () => toggleSn('boletasDrive', alumno.boletasDrive),
      )
    case 'autorizacion':
      return snMark(
        alumno.autorizacionControlEscolar === 'Si',
        alumno.autorizacionControlEscolar === 'Si'
          ? 'Autorizado CE'
          : 'Sin autorización CE',
        () =>
          toggleSn(
            'autorizacionControlEscolar',
            alumno.autorizacionControlEscolar,
          ),
        { variant: 'tile', tileIcon: 'stamp', doneTone: 'blue' },
      )
    case 'validacion':
      return snMark(
        alumno.validacionArchivoFinal === 'Si',
        alumno.validacionArchivoFinal === 'Si'
          ? 'Validado'
          : 'Validación pendiente',
        () =>
          toggleSn('validacionArchivoFinal', alumno.validacionArchivoFinal),
        { variant: 'tile', label: 'Listo' },
      )
    default:
      return <ReadCell>—</ReadCell>
  }
}

type Props = {
  alumnos: Alumno[]
  onChange: (id: string, patch: AlumnoPatch) => void
  canEditNivel: (nivel: Alumno['nivel']) => boolean
}

export function AlumnosTable({ alumnos, onChange, canEditNivel }: Props) {
  const [fichaAlumno, setFichaAlumno] = useState<Alumno | null>(null)
  const [containerW, setContainerW] = useState(1280)
  const [stickEnabled, setStickEnabled] = useState(
    () =>
      typeof window !== 'undefined'
        ? window.matchMedia('(min-width: 768px)').matches
        : true,
  )
  const wrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const measure = () => setContainerW(el.clientWidth || 1280)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const onChangeMq = () => setStickEnabled(mq.matches)
    onChangeMq()
    mq.addEventListener('change', onChangeMq)
    return () => mq.removeEventListener('change', onChangeMq)
  }, [])

  const stickyIds = useMemo(
    () => (stickEnabled ? STICKY_COLUMN_IDS : ([] as ColumnId[])),
    [stickEnabled],
  )

  const visibleColumns = useMemo(() => {
    const bySection = TABLE_COLUMNS.filter((col) =>
      TABLE_INLINE_COLUMN_IDS.includes(col.id),
    ).sort(
      (a, b) =>
        TABLE_INLINE_COLUMN_IDS.indexOf(a.id) -
        TABLE_INLINE_COLUMN_IDS.indexOf(b.id),
    )
    const sticky = stickyIds
      .filter((id) => bySection.some((col) => col.id === id))
      .map((id) => TABLE_COLUMNS.find((col) => col.id === id)!)
    const rest = bySection.filter((col) => !stickyIds.includes(col.id))
    return [...sticky, ...rest]
  }, [stickyIds])

  const visibleIds = useMemo(
    () => visibleColumns.map((c) => c.id),
    [visibleColumns],
  )

  const widthsPx = useMemo(
    () => distributeWidths(visibleIds, DEFAULT_COL_WEIGHTS, containerW),
    [visibleIds, containerW],
  )

  const stickyLeft = useMemo(() => {
    const lefts: Partial<Record<ColumnId, number>> = {}
    if (!stickEnabled) return lefts
    let acc = 0
    for (const id of stickyIds) {
      if (!visibleColumns.some((col) => col.id === id)) continue
      lefts[id] = acc
      acc += widthsPx[id] ?? 0
    }
    return lefts
  }, [visibleColumns, widthsPx, stickEnabled, stickyIds])

  const sectionSpans = useMemo(
    () => sectionSpansFor(visibleIds),
    [visibleIds],
  )

  const tableWidth = containerW

  function stickyStyle(colId: ColumnId, isHeader: boolean, headerRow?: 1 | 2) {
    const left = stickyLeft[colId]
    if (isHeader) {
      const top = headerRow === 2 ? 28 : 0
      // Band con colSpan: solo sticky vertical
      if (headerRow === 1) return { top }
      if (left === undefined) return { top }
      return { top, left }
    }
    if (left === undefined) return undefined
    return { left }
  }

  function stickyClass(colId: ColumnId, isHeader: boolean, headerRow?: 1 | 2) {
    if (!isHeader) {
      if (stickyLeft[colId] === undefined) return ''
      return 'sticky-col sticky z-10 shadow-[2px_0_0_0_var(--color-brand-border)]'
    }
    if (headerRow === 1) return 'sticky z-40'
    if (stickyLeft[colId] === undefined) return 'sticky z-30'
    return 'sticky z-30 shadow-[2px_0_0_0_var(--color-brand-border)]'
  }

  function headTone(colId: ColumnId): string {
    const g = COLUMN_GROUP_BY_ID[colId]
    if (!g) return GROUP_STYLES.identidad.head
    return GROUP_STYLES[g].head
  }

  function bandTone(groupId: GroupId): string {
    return GROUP_STYLES[groupId].band
  }

  /** Más padding en el borde entre secciones (mantiene el color del th/td). */
  function sectionPadClass(index: number, isHeader: boolean): string {
    const col = visibleColumns[index]
    if (!col) return isHeader ? 'px-1.5' : 'px-1'
    const group = COLUMN_GROUP_BY_ID[col.id]
    const prev = visibleColumns[index - 1]
    const next = visibleColumns[index + 1]
    const atGroupStart = Boolean(prev && COLUMN_GROUP_BY_ID[prev.id] !== group)
    const atGroupEnd = Boolean(
      !next || COLUMN_GROUP_BY_ID[next.id] !== group,
    )
    /** Pagos: sin pad de sección (columnas fijas 40px). Drive: pad en bordes. */
    if (isPagoColumn(col.id)) {
      return 'px-1'
    }
    if (isDriveColumn(col.id)) {
      const padL = atGroupStart ? 'pl-10' : 'pl-1'
      const padR = 'pr-1'
      return `${padL} ${padR}`
    }
    const padL = atGroupStart
      ? 'pl-10'
      : isHeader
        ? 'pl-1.5'
        : 'pl-1'
    const padR = atGroupEnd
      ? 'pr-10'
      : isHeader
        ? 'pr-1.5'
        : 'pr-1'
    return `${padL} ${padR}`
  }

  function spanPadClass(spanIndex: number, groupId: GroupId): string {
    const padL = spanIndex > 0 ? 'pl-10' : 'pl-1.5'
    const padR = groupId === 'drive' ? 'pr-1.5' : 'pr-10'
    return `${padL} ${padR}`
  }

  return (
    <div
      ref={wrapRef}
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-brand-border bg-cell shadow-sm"
    >
      {alumnos.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-center text-ink-muted">
          No hay alumnos en este estado para el nivel seleccionado.
        </div>
      ) : (
        <div
          className="table-scroll min-h-0 w-full flex-1 overflow-x-hidden overflow-y-auto overscroll-contain"
        >
          <table
            className="w-full border-collapse"
            style={{
              width: tableWidth,
              minWidth: tableWidth,
              tableLayout: 'fixed',
            }}
          >
            <colgroup>
              {visibleColumns.map((col) => (
                <col key={col.id} style={{ width: widthsPx[col.id] }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {sectionSpans.map((span, spanIndex) => {
                  const firstId = span.columnIds[0]!
                  const driveLink =
                    span.groupId === 'drive' ? DRIVE_PROGRAMA_URL : null
                  return (
                    <th
                      key={span.groupId}
                      colSpan={span.columnIds.length}
                      style={stickyStyle(firstId, true, 1)}
                      className={`border-b border-brand-border py-1.5 text-center text-[0.65rem] font-bold tracking-[0.14em] uppercase ${bandTone(span.groupId)} ${spanPadClass(spanIndex, span.groupId)} ${stickyClass(firstId, true, 1)}`}
                    >
                      <span className="inline-flex items-center justify-center gap-1.5">
                        {span.label}
                        {driveLink ? (
                          <a
                            href={driveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Abrir carpeta Drive"
                            aria-label="Abrir carpeta Drive en nueva pestaña"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex size-5 items-center justify-center rounded text-white hover:bg-white/15"
                          >
                            <FontAwesomeIcon
                              icon={faArrowUpRightFromSquare}
                              className="text-[0.7rem]"
                            />
                          </a>
                        ) : null}
                      </span>
                    </th>
                  )
                })}
              </tr>
              <tr>
                {visibleColumns.map((col, index) => (
                  <th
                    key={col.id}
                    title={col.label}
                    style={stickyStyle(col.id, true, 2)}
                    className={`border-b border-brand-border py-1.5 text-center text-[0.65rem] font-semibold tracking-[0.03em] uppercase ${headTone(col.id)} ${sectionPadClass(index, true)} ${stickyClass(col.id, true, 2)}`}
                  >
                    <span className="block leading-tight">
                      {PAGO_SUBTITLE_USD[col.id] != null
                        ? `$${PAGO_SUBTITLE_USD[col.id]}`
                        : col.shortLabel}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alumnos.map((alumno) => (
                <tr key={alumno.id} className="border-b border-brand-border">
                  {visibleColumns.map((col, index) => (
                    <td
                      key={col.id}
                      style={stickyStyle(col.id, false)}
                      className={`border-b border-brand-border py-1 text-center ${cellTone(alumno.estado, COLUMN_GROUP_BY_ID[col.id])} ${sectionPadClass(index, false)} ${stickyClass(col.id, false)}`}
                    >
                      <AlumnoCell
                        colId={col.id}
                        alumno={alumno}
                        onChange={onChange}
                        editable={canEditNivel(alumno.nivel)}
                        onOpenFicha={() => setFichaAlumno(alumno)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <AlumnoFichaModal
        open={Boolean(fichaAlumno)}
        alumno={
          fichaAlumno
            ? (alumnos.find((a) => a.id === fichaAlumno.id) ?? fichaAlumno)
            : null
        }
        onClose={() => setFichaAlumno(null)}
      />
    </div>
  )
}
