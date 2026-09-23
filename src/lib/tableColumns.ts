export type ColumnId =
  | 'folio'
  | 'alumnoRef'
  | 'estado'
  | 'nivel'
  | 'grado'
  | 'nombre'
  | 'curp'
  | 'nacimiento'
  | 'correo'
  | 'incorporacion'
  | 'pago1'
  | 'pago2'
  | 'pago3'
  | 'total'
  | 'saldo'
  | 'estatus'
  | 'bienvenida'
  | 'carpeta'
  | 'curpDrive'
  | 'boletas'
  | 'expediente'
  | 'autorizacion'
  | 'validacion'
  | 'fechaArchivo'
  | 'devolucionSn'
  | 'fechaDevolucion'
  | 'observaciones'
  | 'ficha'

export type TableColumn = {
  id: ColumnId
  /** Título completo (ficha, tooltips). */
  label: string
  /** Etiqueta corta del sub-header en tabla. */
  shortLabel: string
  /** Peso relativo del ancho (misma familia → mismo peso). */
  weight: number
}

export const TABLE_COLUMNS: TableColumn[] = [
  { id: 'folio', label: 'Folio', shortLabel: 'Folio', weight: 3 },
  { id: 'ficha', label: 'Ficha', shortLabel: 'Ficha', weight: 1.5 },
  { id: 'nombre', label: 'Nombre', shortLabel: 'Nombre', weight: 10 },
  { id: 'estado', label: 'Estado', shortLabel: 'Estado', weight: 5 },
  { id: 'pago1', label: 'Pago 1', shortLabel: 'Pago1', weight: 1.5 },
  { id: 'pago2', label: 'Pago 2', shortLabel: 'Pago2', weight: 1.5 },
  { id: 'pago3', label: 'Pago 3', shortLabel: 'Pago3', weight: 1.5 },
  { id: 'estatus', label: 'Estatus pago', shortLabel: 'Estatus', weight: 8 },
  { id: 'carpeta', label: 'Carpeta Drive', shortLabel: 'Carpeta', weight: 4 },
  { id: 'curpDrive', label: 'CURP Drive', shortLabel: 'CURP', weight: 4 },
  { id: 'boletas', label: 'Boletas Drive', shortLabel: 'Boletas', weight: 4 },
  { id: 'expediente', label: 'Expediente', shortLabel: 'Expediente', weight: 6 },
  {
    id: 'autorizacion',
    label: 'Autorización CE',
    shortLabel: 'Autorización',
    weight: 4.5,
  },
  {
    id: 'validacion',
    label: 'Validación final',
    shortLabel: 'Validación',
    weight: 4.5,
  },
  { id: 'devolucionSn', label: 'Devolución', shortLabel: 'Devolución', weight: 4.5 },
  // Solo ficha
  { id: 'bienvenida', label: 'Correo bienvenida', shortLabel: 'Bienvenida', weight: 4.5 },
  { id: 'alumnoRef', label: 'Ref', shortLabel: 'Ref', weight: 7 },
  { id: 'nivel', label: 'Nivel', shortLabel: 'Nivel', weight: 7 },
  { id: 'grado', label: 'Grado', shortLabel: 'Grado', weight: 4 },
  { id: 'curp', label: 'CURP', shortLabel: 'CURP', weight: 11 },
  { id: 'nacimiento', label: 'Nacimiento', shortLabel: 'Nacimiento', weight: 8 },
  { id: 'correo', label: 'Correo tutor', shortLabel: 'Correo', weight: 11 },
  {
    id: 'incorporacion',
    label: 'Incorporación',
    shortLabel: 'Incorporación',
    weight: 8,
  },
  { id: 'total', label: 'Total', shortLabel: 'Total', weight: 7 },
  { id: 'saldo', label: 'Saldo', shortLabel: 'Saldo', weight: 7 },
  { id: 'fechaArchivo', label: 'Fecha archivo', shortLabel: 'Archivo', weight: 8 },
  {
    id: 'fechaDevolucion',
    label: 'Fecha devolución',
    shortLabel: 'Devolución',
    weight: 8,
  },
  {
    id: 'observaciones',
    label: 'Observaciones',
    shortLabel: 'Observaciones',
    weight: 10,
  },
]

/** Operativo en tabla. */
export const TABLE_INLINE_COLUMN_IDS: ColumnId[] = [
  'folio',
  'ficha',
  'nombre',
  'estado',
  'pago1',
  'pago2',
  'pago3',
  'carpeta',
  'curpDrive',
  'boletas',
  'autorizacion',
  'validacion',
]

export const DEFAULT_COL_WEIGHTS = Object.fromEntries(
  TABLE_COLUMNS.map((col) => [col.id, col.weight]),
) as Record<ColumnId, number>

/** @deprecated alias */
export const DEFAULT_COL_WIDTHS_VW = DEFAULT_COL_WEIGHTS
export const DEFAULT_COL_WIDTHS = DEFAULT_COL_WEIGHTS

export type GroupId =
  | 'identidad'
  | 'pagos'
  | 'drive'
  | 'cierre'
  | 'devoluciones'

export type ColumnGroup = {
  id: GroupId
  label: string
  columnIds: ColumnId[]
}

export const COLUMN_GROUPS: ColumnGroup[] = [
  {
    id: 'identidad',
    label: 'Alumno',
    columnIds: ['folio', 'ficha', 'nombre', 'estado'],
  },
  {
    id: 'pagos',
    label: 'Pagos',
    columnIds: ['pago1', 'pago2', 'pago3'],
  },
  {
    id: 'drive',
    label: 'Drive',
    columnIds: ['carpeta', 'curpDrive', 'boletas'],
  },
  {
    id: 'cierre',
    label: 'Cierre',
    columnIds: ['autorizacion', 'validacion'],
  },
  {
    id: 'devoluciones',
    label: 'Devoluciones',
    columnIds: ['devolucionSn'],
  },
]

export const COLUMN_GROUP_BY_ID: Record<ColumnId, GroupId | null> =
  Object.fromEntries(
    TABLE_COLUMNS.map((col) => {
      const group = COLUMN_GROUPS.find((g) => g.columnIds.includes(col.id))
      return [col.id, group?.id ?? null] as const
    }),
  ) as Record<ColumnId, GroupId | null>

export const STICKY_COLUMN_IDS: ColumnId[] = ['folio', 'ficha', 'nombre']

/** Contenido alineado a la izquierda (títulos siempre centrados). */
export const COL_CONTENT_LEFT: readonly ColumnId[] = []

/** Pares head/celda (fondos unificados; aire entre secciones en la tabla). */
const STRIPE_WHITE = {
  chip: 'bg-sec-white-head text-ink border-brand-border',
  head: 'bg-sec-white-head text-ink',
  band: 'bg-sec-bar text-sec-bar-text',
  cell: 'bg-sec-white',
}
const STRIPE_BLUE = {
  chip: 'bg-sec-blue-head text-ink border-brand-border',
  head: 'bg-sec-blue-head text-ink',
  band: 'bg-sec-bar text-sec-bar-text',
  cell: 'bg-sec-blue',
}
const STRIPE_BAR = {
  chip: 'bg-sec-bar text-sec-bar-text border-brand-border',
  head: 'bg-sec-white-head text-ink',
  band: 'bg-sec-bar text-sec-bar-text',
  cell: 'bg-sec-bar-muted',
}

export const GROUP_STYLES: Record<
  GroupId,
  { chip: string; head: string; band: string; cell: string }
> = {
  identidad: STRIPE_WHITE,
  pagos: STRIPE_BLUE,
  drive: STRIPE_BAR,
  cierre: STRIPE_BAR,
  devoluciones: STRIPE_WHITE,
}

export type SectionSpan = {
  groupId: GroupId
  label: string
  columnIds: ColumnId[]
}

/** Agrupa columnas visibles contiguas por sección (para el band header). */
export function sectionSpansFor(ids: ColumnId[]): SectionSpan[] {
  const spans: SectionSpan[] = []
  for (const id of ids) {
    const groupId = COLUMN_GROUP_BY_ID[id]
    if (!groupId) continue
    const last = spans[spans.length - 1]
    if (last && last.groupId === groupId) {
      last.columnIds.push(id)
    } else {
      const group = COLUMN_GROUPS.find((g) => g.id === groupId)!
      spans.push({ groupId, label: group.label, columnIds: [id] })
    }
  }
  return spans
}

/** Ancho fijo de columna pago (= size-8 + aire mínimo). */
export const PAGO_COL_PX = 40
/** Padding entre secciones (pl-10 / pr-10) — se suma al ancho de bordes Drive. */
export const SECTION_EDGE_PAD_PX = 40

export function isPagoColumn(id: ColumnId): boolean {
  return id === 'pago1' || id === 'pago2' || id === 'pago3'
}

export function isDriveColumn(id: ColumnId): boolean {
  return id === 'carpeta' || id === 'curpDrive' || id === 'boletas'
}

/** Reparte el ancho total según pesos. Pagos fijos; Drive en 3 anchos de contenido iguales. */
export function distributeWidths(
  ids: ColumnId[],
  weights: Record<ColumnId, number>,
  totalPx: number,
): Record<ColumnId, number> {
  const safe = Math.max(0, totalPx)
  const out = {} as Record<ColumnId, number>
  const pagoIds = ids.filter(isPagoColumn)
  const driveIds = ids.filter(isDriveColumn)
  const otherIds = ids.filter((id) => !isPagoColumn(id) && !isDriveColumn(id))

  for (const id of pagoIds) out[id] = PAGO_COL_PX

  const pagoUsed = pagoIds.length * PAGO_COL_PX
  const restBudget = Math.max(0, safe - pagoUsed)

  const driveWeight = driveIds.reduce(
    (s, id) => s + Math.max(0.5, weights[id] ?? 1),
    0,
  )
  const otherWeight = otherIds.reduce(
    (s, id) => s + Math.max(0.5, weights[id] ?? 1),
    0,
  )
  const sumW = driveWeight + otherWeight

  /** Espacio extra solo al inicio de Drive (pagos|drive); el cierre aporta su pl. */
  const driveEdgeExtra = driveIds.length > 0 ? SECTION_EDGE_PAD_PX : 0

  const driveBudget =
    driveIds.length === 0 || sumW <= 0
      ? 0
      : Math.round((driveWeight / sumW) * restBudget)
  const driveContentBudget = Math.max(0, driveBudget - driveEdgeExtra)
  const driveEach =
    driveIds.length === 0
      ? 0
      : Math.max(32, Math.floor(driveContentBudget / driveIds.length))

  driveIds.forEach((id, i) => {
    let px = driveEach
    if (i === 0) px += SECTION_EDGE_PAD_PX
    out[id] = px
  })

  const driveUsed = driveIds.reduce((s, id) => s + (out[id] ?? 0), 0)
  const otherBudget = Math.max(0, restBudget - driveUsed)
  const sumOther = otherIds.reduce(
    (s, id) => s + Math.max(0.5, weights[id] ?? 1),
    0,
  )
  let used = 0
  otherIds.forEach((id, i) => {
    const w = Math.max(0.5, weights[id] ?? 1)
    if (i === otherIds.length - 1) {
      out[id] = Math.max(32, otherBudget - used)
    } else {
      const px = Math.max(32, Math.round((w / sumOther) * otherBudget))
      out[id] = px
      used += px
    }
  })
  return out
}

export function mostrarDevolucionEnTabla(alumno: {
  estado: string
  devolucionSolicitada: string
}): boolean {
  if (alumno.estado === 'Activo' && alumno.devolucionSolicitada !== 'Si') {
    return false
  }
  return (
    alumno.estado === 'Baja - gestionar devolución' ||
    alumno.estado === 'Reembolso Realizado' ||
    alumno.devolucionSolicitada === 'Si'
  )
}
