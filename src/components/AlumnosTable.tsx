import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronDown,
  faChevronRight,
  faFilePdf,
  faTableColumns,
} from '@fortawesome/free-solid-svg-icons'
import { COL_ASSIGN_KEY, COL_GROUPS_KEY, COL_WIDTHS_KEY, formatUsd } from '../lib/constants'
import { generateAndDownloadCarta } from '../lib/generateCartaBienvenida'
import { estatusPago, saldo, totalPagado } from '../lib/pagos'
import {
  COLUMN_GROUP_BY_ID,
  COLUMN_GROUPS,
  DEFAULT_COL_WIDTHS,
  GROUP_STYLES,
  STICKY_COLUMN_IDS,
  TABLE_COLUMNS,
  type ColumnId,
  type GroupId,
} from '../lib/tableColumns'
import {
  ESTADOS,
  SN_OPTIONS,
  type Alumno,
  type AlumnoPatch,
  type EstadoAlumno,
  type SN,
} from '../types/alumno'
import { ColumnAssignModal } from './ColumnAssignModal'

const inputClass =
  'box-border w-full min-w-0 rounded-md border border-brand-border px-2 py-1.5 text-sm text-ink outline-none focus:ring-1 focus:ring-white'
const readClass = 'truncate px-0.5 py-1 text-sm text-ink'

type CollapsedMap = Record<GroupId, boolean>

function loadWidths(): Record<ColumnId, number> {
  try {
    const raw = localStorage.getItem(COL_WIDTHS_KEY)
    if (!raw) return { ...DEFAULT_COL_WIDTHS }
    return { ...DEFAULT_COL_WIDTHS, ...(JSON.parse(raw) as Record<ColumnId, number>) }
  } catch {
    return { ...DEFAULT_COL_WIDTHS }
  }
}

function defaultCollapsed(): CollapsedMap {
  return {
    identidad: false,
    personales: false,
    pagos: false,
    expediente: false,
    devoluciones: false,
  }
}

function loadCollapsed(): CollapsedMap {
  try {
    const raw = localStorage.getItem(COL_GROUPS_KEY)
    if (!raw) return defaultCollapsed()
    return { ...defaultCollapsed(), ...(JSON.parse(raw) as CollapsedMap) }
  } catch {
    return defaultCollapsed()
  }
}

function loadAssignments(): Record<ColumnId, GroupId> {
  try {
    const raw = localStorage.getItem(COL_ASSIGN_KEY)
    if (!raw) return { ...COLUMN_GROUP_BY_ID }
    return {
      ...COLUMN_GROUP_BY_ID,
      ...(JSON.parse(raw) as Record<ColumnId, GroupId>),
    }
  } catch {
    return { ...COLUMN_GROUP_BY_ID }
  }
}

function groupOrder(id: GroupId): number {
  return COLUMN_GROUPS.findIndex((group) => group.id === id)
}

/** Fondo de CELDA: siempre franja de sección (sin tinte de estado en toda la fila). */
function cellTone(_estado: EstadoAlumno, groupId: GroupId): string {
  return GROUP_STYLES[groupId].cell
}

/**
 * Inputs de la fila (excepto select Estado).
 * Baja: solo un borde suave; fondo = celda normal (tone vacío → bg-cell).
 */
function rowInputTone(estado: EstadoAlumno): string {
  if (estado === 'Baja - gestionar devolución') {
    return 'border-estado-baja-border/50'
  }
  if (estado === 'Reembolso Realizado') {
    return 'border-estado-reembolso-border/40 text-ink-muted'
  }
  return ''
}

/** Select Estado: badge apagado (sin neón) sobre el azul de la tabla. */
function estadoSelectClass(estado: EstadoAlumno): string {
  if (estado === 'Baja - gestionar devolución') {
    return 'border-estado-baja-border bg-estado-baja-input font-semibold text-estado-baja-text'
  }
  if (estado === 'Reembolso Realizado') {
    return 'border-estado-reembolso-border bg-estado-reembolso-input font-medium text-estado-reembolso-text'
  }
  return 'border-estado-activo-border bg-estado-activo-input font-semibold text-estado-activo-text'
}

type CellProps = {
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'email' | 'date'
  warn?: boolean
  tone?: string
  onBlurCommit?: (value: string) => void
  title?: string
}

function CellInput({
  value,
  onChange,
  type = 'text',
  warn,
  tone = '',
  onBlurCommit,
  title,
}: CellProps) {
  return (
    <input
      type={type}
      value={value}
      title={title}
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => onBlurCommit?.(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onBlurCommit) {
          ;(e.target as HTMLInputElement).blur()
        }
      }}
      className={`${inputClass} ${tone || 'bg-cell'} ${
        warn && !value.trim() ? 'border-baja-text ring-1 ring-baja-border' : ''
      }`}
    />
  )
}

function CellSelect({
  value,
  options,
  onChange,
  className = '',
  tone = '',
}: {
  value: string
  options: readonly string[]
  onChange: (value: string) => void
  className?: string
  tone?: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputClass} ${className || tone || 'bg-cell'}`}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  )
}

function ReadCell({
  children,
  title,
}: {
  children: ReactNode
  title?: string
}) {
  return (
    <div className={readClass} title={title}>
      {children || '—'}
    </div>
  )
}

function BienvenidaCell({
  alumno,
  tone,
  onChange,
}: {
  alumno: Alumno
  tone: string
  onChange: (value: string) => void
}) {
  const [busy, setBusy] = useState(false)
  const canDownload = Boolean(alumno.nombreCompleto?.trim())

  return (
    <div className="flex min-w-0 items-center gap-1">
      <div className="min-w-0 flex-1">
        <CellInput
          type="date"
          value={alumno.fechaCorreoBienvenida}
          onChange={onChange}
          tone={tone}
        />
      </div>
      <button
        type="button"
        disabled={!canDownload || busy}
        title={
          canDownload
            ? 'Descargar carta de bienvenida (PDF)'
            : 'Sin nombre de alumno para generar la carta'
        }
        aria-label="Descargar carta de bienvenida PDF"
        onClick={() => {
          void (async () => {
            setBusy(true)
            try {
              await generateAndDownloadCarta(alumno)
            } finally {
              setBusy(false)
            }
          })()
        }}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-brand-border bg-cell text-brand-accent hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-40"
      >
        <FontAwesomeIcon
          icon={faFilePdf}
          className={`text-sm ${busy ? 'animate-pulse' : ''}`}
        />
      </button>
    </div>
  )
}

function AlumnoCell({
  colId,
  alumno,
  onChange,
}: {
  colId: ColumnId
  alumno: Alumno
  onChange: (id: string, patch: AlumnoPatch) => void
}) {
  const warnObs =
    alumno.estado === 'Baja - gestionar devolución' ||
    alumno.devolucionSolicitada === 'S'
  const patch = (next: AlumnoPatch) => onChange(alumno.id, next)
  const tone = rowInputTone(alumno.estado)

  switch (colId) {
    case 'folio':
      return <ReadCell>{alumno.folio}</ReadCell>
    case 'alumnoRef':
      return <ReadCell>{alumno.alumnoRef}</ReadCell>
    case 'estado':
      return (
        <CellSelect
          value={alumno.estado}
          options={ESTADOS}
          className={estadoSelectClass(alumno.estado)}
          onChange={(estado) => patch({ estado: estado as Alumno['estado'] })}
        />
      )
    case 'nivel':
      return <ReadCell>{alumno.nivel}</ReadCell>
    case 'grado':
      return <ReadCell>{alumno.grado}</ReadCell>
    case 'nombre':
      return (
        <ReadCell title="Desde ficha alumno (alumno_id)">
          {alumno.nombreCompleto}
        </ReadCell>
      )
    case 'curp':
      return <ReadCell>{alumno.curp}</ReadCell>
    case 'nacimiento':
      return <ReadCell>{alumno.fechaNacimiento}</ReadCell>
    case 'correo':
      return <ReadCell>{alumno.correoTutor}</ReadCell>
    case 'incorporacion':
      return <ReadCell>{alumno.tipoIncorporacion}</ReadCell>
    case 'pago1':
      return <ReadCell>{alumno.fechaPago1}</ReadCell>
    case 'pago2':
      return <ReadCell>{alumno.fechaPago2}</ReadCell>
    case 'pago3':
      return <ReadCell>{alumno.fechaPago3}</ReadCell>
    case 'total':
      return <ReadCell>{formatUsd(totalPagado(alumno))}</ReadCell>
    case 'saldo':
      return <ReadCell>{formatUsd(saldo(alumno))}</ReadCell>
    case 'estatus':
      return <ReadCell>{estatusPago(alumno)}</ReadCell>
    case 'bienvenida':
      return (
        <BienvenidaCell
          alumno={alumno}
          tone={tone}
          onChange={(fechaCorreoBienvenida) => patch({ fechaCorreoBienvenida })}
        />
      )
    case 'alta':
      return (
        <CellInput
          type="date"
          value={alumno.fechaAltaReporteInicial}
          onChange={(fechaAltaReporteInicial) =>
            patch({ fechaAltaReporteInicial })
          }
          tone={tone}
        />
      )
    case 'carpeta':
      return (
        <CellSelect
          value={alumno.carpetaDrive}
          options={SN_OPTIONS}
          tone={tone}
          onChange={(carpetaDrive) =>
            patch({ carpetaDrive: carpetaDrive as SN })
          }
        />
      )
    case 'curpDrive':
      return (
        <CellSelect
          value={alumno.curpDrive}
          options={SN_OPTIONS}
          tone={tone}
          onChange={(curpDrive) => patch({ curpDrive: curpDrive as SN })}
        />
      )
    case 'boletas':
      return (
        <CellSelect
          value={alumno.boletasDrive}
          options={SN_OPTIONS}
          tone={tone}
          onChange={(boletasDrive) =>
            patch({ boletasDrive: boletasDrive as SN })
          }
        />
      )
    case 'expediente':
      return (
        <CellInput
          value={alumno.expedienteDocumental}
          onChange={(expedienteDocumental) => patch({ expedienteDocumental })}
          tone={tone}
        />
      )
    case 'autorizacion':
      return (
        <CellSelect
          value={alumno.autorizacionControlEscolar}
          options={SN_OPTIONS}
          tone={tone}
          onChange={(autorizacionControlEscolar) =>
            patch({
              autorizacionControlEscolar: autorizacionControlEscolar as SN,
            })
          }
        />
      )
    case 'validacion':
      return (
        <CellSelect
          value={alumno.validacionArchivoFinal}
          options={SN_OPTIONS}
          tone={tone}
          onChange={(validacionArchivoFinal) =>
            patch({ validacionArchivoFinal: validacionArchivoFinal as SN })
          }
        />
      )
    case 'fechaArchivo':
      return (
        <CellInput
          type="date"
          value={alumno.fechaInclusionArchivoFinal}
          onChange={(fechaInclusionArchivoFinal) =>
            patch({ fechaInclusionArchivoFinal })
          }
          tone={tone}
        />
      )
    case 'devolucionSn':
      return (
        <CellSelect
          value={alumno.devolucionSolicitada}
          options={SN_OPTIONS}
          tone={tone}
          onChange={(devolucionSolicitada) =>
            patch({ devolucionSolicitada: devolucionSolicitada as SN })
          }
        />
      )
    case 'fechaDevolucion':
      return (
        <CellInput
          type="date"
          value={alumno.fechaDevolucion}
          onChange={(fechaDevolucion) => patch({ fechaDevolucion })}
          tone={tone}
        />
      )
    case 'observaciones':
      return (
        <CellInput
          warn={warnObs}
          value={alumno.observaciones}
          onChange={(observaciones) => patch({ observaciones })}
          tone={tone}
        />
      )
  }
}

type Props = {
  alumnos: Alumno[]
  onChange: (id: string, patch: AlumnoPatch) => void
}

export function AlumnosTable({ alumnos, onChange }: Props) {
  const [widths, setWidths] = useState<Record<ColumnId, number>>(loadWidths)
  const [collapsed, setCollapsed] = useState<CollapsedMap>(loadCollapsed)
  const [assignments, setAssignments] =
    useState<Record<ColumnId, GroupId>>(loadAssignments)
  const [assignOpen, setAssignOpen] = useState(false)
  const [jumpTo, setJumpTo] = useState<GroupId | null>(null)
  /** En pantallas angostas las columnas fijas comen demasiado ancho: se desactivan. */
  const [stickEnabled, setStickEnabled] = useState(
    () =>
      typeof window !== 'undefined'
        ? window.matchMedia('(min-width: 768px)').matches
        : true,
  )
  const colRefs = useRef<Partial<Record<ColumnId, HTMLTableCellElement | null>>>(
    {},
  )
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const onChangeMq = () => setStickEnabled(mq.matches)
    onChangeMq()
    mq.addEventListener('change', onChangeMq)
    return () => mq.removeEventListener('change', onChangeMq)
  }, [])

  useEffect(() => {
    localStorage.setItem(COL_WIDTHS_KEY, JSON.stringify(widths))
  }, [widths])

  useEffect(() => {
    localStorage.setItem(COL_GROUPS_KEY, JSON.stringify(collapsed))
  }, [collapsed])

  useEffect(() => {
    localStorage.setItem(COL_ASSIGN_KEY, JSON.stringify(assignments))
  }, [assignments])

  const stickyIds = useMemo(
    () => (stickEnabled ? STICKY_COLUMN_IDS : ([] as ColumnId[])),
    [stickEnabled],
  )

  const visibleColumns = useMemo(() => {
    const bySection = TABLE_COLUMNS.filter(
      (col) => !collapsed[assignments[col.id]],
    ).sort((a, b) => {
      const groupDiff =
        groupOrder(assignments[a.id]) - groupOrder(assignments[b.id])
      if (groupDiff !== 0) return groupDiff
      return (
        TABLE_COLUMNS.findIndex((col) => col.id === a.id) -
        TABLE_COLUMNS.findIndex((col) => col.id === b.id)
      )
    })
    const sticky = stickyIds
      .filter((id) => bySection.some((col) => col.id === id))
      .map((id) => TABLE_COLUMNS.find((col) => col.id === id)!)
    const rest = bySection.filter((col) => !stickyIds.includes(col.id))
    return [...sticky, ...rest]
  }, [assignments, collapsed, stickyIds])

  const stickyLeft = useMemo(() => {
    const lefts: Partial<Record<ColumnId, number>> = {}
    if (!stickEnabled) return lefts
    let acc = 0
    for (const id of stickyIds) {
      if (!visibleColumns.some((col) => col.id === id)) continue
      lefts[id] = acc
      acc += widths[id]
    }
    return lefts
  }, [visibleColumns, widths, stickEnabled, stickyIds])

  /** Ancho total de columnas fijas (folio + nombre).
   *  STICKY_BAR_FINE_TUNE_PX: ajuste fino del hueco de la barra
   *  (positivo = más ancho; negativo = menos). Útil si el espaciador
   *  no alinea perfecto con el borde derecho de "nombre".
   */
  /** Ancho fijo (px) del botón chevron en cada sección. */
  const SECTION_CHEVRON_PX = 34
  const stickyWidth = useMemo(
    () =>
      stickyIds.reduce(
        (sum, id) =>
          visibleColumns.some((col) => col.id === id) ? sum + widths[id] : sum,
        0,
      ),
    [visibleColumns, widths, stickyIds],
  )

  const tableWidth = useMemo(
    () => visibleColumns.reduce((sum, col) => sum + widths[col.id], 0),
    [visibleColumns, widths],
  )

  useEffect(() => {
    if (!jumpTo) return
    const scroller = scrollRef.current
    // Primera columna de la sección que NO sea fija (folio/nombre).
    const first = visibleColumns.find(
      (col) =>
        assignments[col.id] === jumpTo &&
        !stickyIds.includes(col.id),
    )
    const cell = first ? colRefs.current[first.id] : null
    if (scroller && cell) {
      /**
       * Salto horizontal a una sección:
       * cell.offsetLeft = inicio de la columna en la tabla
       * stickyWidth     = ancho de folio + nombre (fijas)
       * STICKY_JUMP_FINE_TUNE_PX = ajuste fino extra (manual)
       * Resultado: la sección queda justo a la derecha de las fijas.
       */
      const STICKY_JUMP_FINE_TUNE_PX = stickEnabled ? 40 : 0
      const table = cell.closest('table')
      const cellLeft = table
        ? cell.offsetLeft
        : cell.getBoundingClientRect().left -
          scroller.getBoundingClientRect().left +
          scroller.scrollLeft
      scroller.scrollTo({
        left: Math.max(0, cellLeft - stickyWidth - STICKY_JUMP_FINE_TUNE_PX),
        behavior: 'smooth',
      })
    }
    setJumpTo(null)
  }, [jumpTo, assignments, visibleColumns, stickyWidth, stickyIds, stickEnabled])

  const startResize = useCallback(
    (id: ColumnId, event: ReactPointerEvent<HTMLButtonElement>) => {
      event.preventDefault()
      event.stopPropagation()
      const originX = event.clientX
      const originW = widths[id]
      const onMove = (ev: PointerEvent) => {
        setWidths((prev) => ({
          ...prev,
          [id]: Math.max(56, originW + ev.clientX - originX),
        }))
      }
      const onUp = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [widths],
  )

  function jumpToGroup(id: GroupId) {
    if (collapsed[id]) {
      setCollapsed((prev) => ({ ...prev, [id]: false }))
    }
    setJumpTo(id)
  }

  function toggleGroup(id: GroupId) {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function assignColumn(columnId: ColumnId, groupId: GroupId) {
    setAssignments((prev) => ({ ...prev, [columnId]: groupId }))
    setCollapsed((prev) => ({ ...prev, [groupId]: false }))
  }

  function stickyStyle(colId: ColumnId, isHeader: boolean) {
    const left = stickyLeft[colId]
    if (left === undefined) {
      return isHeader ? { top: 0 } : undefined
    }
    return isHeader ? { top: 0, left } : { left }
  }

  function stickyClass(colId: ColumnId, isHeader: boolean) {
    if (stickyLeft[colId] === undefined) {
      return isHeader ? 'sticky top-0 z-20' : ''
    }
    return isHeader
      ? 'sticky z-30 shadow-[2px_0_0_0_var(--color-brand-border)]'
      : 'sticky-col sticky z-10 shadow-[2px_0_0_0_var(--color-brand-border)]'
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-brand-border bg-cell shadow-sm">
      {/*
        === BARRA DE SECCIONES (arriba de la tabla) ===
        Móvil: scroll horizontal de secciones (tabla completa se mantiene).
        md+: hueco alineado con columnas sticky + secciones flex.
      */}
      <div className="flex w-full shrink-0 items-stretch border-b border-brand-border bg-sec-bar text-sec-bar-text">
        {stickEnabled && stickyWidth > 0 ? (
          <div
            className="hidden shrink-0 border-r border-white/15 md:block"
            style={{ width: Math.max(0, stickyWidth) }}
            aria-hidden
          />
        ) : null}

        <div className="flex min-w-0 flex-1 items-stretch overflow-x-auto">
          {COLUMN_GROUPS.map((group, index) => {
            const isCollapsed = collapsed[group.id]
            return (
              <div
                key={group.id}
                className={`flex min-w-[7.5rem] shrink-0 items-stretch sm:min-w-0 sm:flex-1 ${
                  index > 0 ? 'border-l border-white/15' : ''
                } ${isCollapsed ? 'opacity-60' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => jumpToGroup(group.id)}
                  className="min-w-0 flex-1 truncate px-2.5 py-2 text-left text-[0.65rem] font-semibold tracking-[0.06em] uppercase hover:bg-white/10 sm:px-3 sm:py-2.5 sm:text-xs"
                  title={`Ir a ${group.label}`}
                >
                  {group.label}
                </button>
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  style={{ width: SECTION_CHEVRON_PX }}
                  className="flex shrink-0 items-center justify-center border-l border-white/15 hover:bg-white/10"
                  aria-label={
                    isCollapsed
                      ? `Mostrar ${group.label}`
                      : `Ocultar ${group.label}`
                  }
                  title={isCollapsed ? 'Desplegar' : 'Colapsar'}
                >
                  <FontAwesomeIcon
                    icon={isCollapsed ? faChevronRight : faChevronDown}
                    className="text-xs"
                  />
                </button>
              </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => setAssignOpen(true)}
          className="inline-flex shrink-0 items-center gap-1.5 border-l border-white/15 bg-sec-bar px-2.5 text-xs font-semibold text-sec-bar-text hover:bg-white/10 sm:gap-2 sm:px-3.5 sm:text-sm"
        >
          <FontAwesomeIcon icon={faTableColumns} />
          <span className="hidden sm:inline">Columnas</span>
        </button>
      </div>
      <p className="shrink-0 border-b border-brand-border bg-brand-soft/60 px-3 py-1 text-[0.7rem] text-ink-muted md:hidden">
        Deslice la tabla en horizontal y vertical para ver todas las columnas.
      </p>
      {alumnos.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6 text-center text-ink-muted">
          No hay alumnos en este estado para el nivel seleccionado.
        </div>
      ) : visibleColumns.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6 text-center text-ink-muted">
          Todas las secciones están ocultas. Use el chevron para desplegarlas.
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="table-scroll min-h-0 flex-1 overflow-x-auto overflow-y-auto overscroll-contain"
        >
          <table
            className="border-collapse text-left"
            style={{ width: tableWidth, minWidth: tableWidth, tableLayout: 'fixed' }}
          >
            <colgroup>
              {visibleColumns.map((col) => (
                <col key={col.id} style={{ width: widths[col.id] }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {visibleColumns.map((col) => (
                  <th
                    key={col.id}
                    ref={(el) => {
                      colRefs.current[col.id] = el
                    }}
                    style={stickyStyle(col.id, true)}
                    className={`relative border-b border-brand-border px-2.5 py-1.5 text-left text-xs font-semibold tracking-[0.04em] text-ink uppercase ${GROUP_STYLES[assignments[col.id]].head} ${stickyClass(col.id, true)}`}
                  >
                    <span className="pr-2">{col.label}</span>
                    <button
                      type="button"
                      aria-label={`Redimensionar columna ${col.label}`}
                      onPointerDown={(e) => startResize(col.id, e)}
                      className="absolute top-0 right-0 h-full w-2 cursor-col-resize touch-none hover:bg-brand-accent/40"
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alumnos.map((alumno) => (
                <tr key={alumno.id} className="border-b border-brand-border">
                  {visibleColumns.map((col) => (
                    <td
                      key={col.id}
                      style={stickyStyle(col.id, false)}
                      className={`border-b border-brand-border px-2 py-1.5 ${cellTone(alumno.estado, assignments[col.id])} ${stickyClass(col.id, false)}`}
                    >
                      <AlumnoCell
                        colId={col.id}
                        alumno={alumno}
                        onChange={onChange}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ColumnAssignModal
        open={assignOpen}
        assignments={assignments}
        onAssign={assignColumn}
        onClose={() => setAssignOpen(false)}
      />
    </div>
  )
}
