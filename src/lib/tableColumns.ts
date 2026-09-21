import { PAGO_1_USD, PAGO_2_USD, PAGO_3_USD, formatUsd } from './constants'

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

export type TableColumn = {
  id: ColumnId
  label: string
  width: number
}

export const TABLE_COLUMNS: TableColumn[] = [
  { id: 'folio', label: 'Folio', width: 100 },
  { id: 'alumnoRef', label: 'Ref', width: 110 },
  { id: 'estado', label: 'Estado', width: 210 },
  { id: 'nivel', label: 'Nivel', width: 124 },
  { id: 'grado', label: 'Grado', width: 70 },
  { id: 'nombre', label: 'Nombre completo', width: 230 },
  { id: 'curp', label: 'CURP', width: 200 },
  { id: 'nacimiento', label: 'Nacimiento', width: 148 },
  { id: 'correo', label: 'Correo tutor', width: 210 },
  { id: 'incorporacion', label: 'Incorporación', width: 148 },
  { id: 'pago1', label: `Pago 1 ${formatUsd(PAGO_1_USD)}`, width: 156 },
  { id: 'pago2', label: `Pago 2 ${formatUsd(PAGO_2_USD)}`, width: 156 },
  { id: 'pago3', label: `Pago 3 ${formatUsd(PAGO_3_USD)}`, width: 156 },
  { id: 'total', label: 'Total pagado', width: 132 },
  { id: 'saldo', label: 'Saldo', width: 124 },
  { id: 'estatus', label: 'Estatus pago', width: 148 },
  { id: 'bienvenida', label: 'Correo bienvenida', width: 188 },
  { id: 'carpeta', label: 'Carpeta Drive', width: 104 },
  { id: 'curpDrive', label: 'CURP Drive', width: 104 },
  { id: 'boletas', label: 'Boletas Drive', width: 104 },
  { id: 'expediente', label: 'Expediente documental', width: 150 },
  { id: 'autorizacion', label: 'Autorización Control Escolar', width: 136 },
  { id: 'validacion', label: 'Validación archivo final', width: 136 },
  { id: 'fechaArchivo', label: 'Fecha archivo final', width: 156 },
  { id: 'devolucionSn', label: 'Devolución solicitada', width: 136 },
  { id: 'fechaDevolucion', label: 'Fecha devolución', width: 156 },
  { id: 'observaciones', label: 'Observaciones', width: 250 },
]

export const DEFAULT_COL_WIDTHS = Object.fromEntries(
  TABLE_COLUMNS.map((col) => [col.id, col.width]),
) as Record<ColumnId, number>

export type GroupId =
  | 'identidad'
  | 'personales'
  | 'pagos'
  | 'expediente'
  | 'devoluciones'

export type ColumnGroup = {
  id: GroupId
  label: string
  columnIds: ColumnId[]
}

export const COLUMN_GROUPS: ColumnGroup[] = [
  {
    id: 'identidad',
    label: 'Identidad',
    columnIds: ['folio', 'alumnoRef', 'estado', 'nivel', 'grado'],
  },
  {
    id: 'personales',
    label: 'Datos personales',
    columnIds: ['nombre', 'curp', 'nacimiento', 'correo', 'incorporacion'],
  },
  {
    id: 'pagos',
    label: 'Pagos',
    columnIds: ['pago1', 'pago2', 'pago3', 'total', 'saldo', 'estatus'],
  },
  {
    id: 'expediente',
    label: 'Expediente',
    columnIds: [
      'bienvenida',
      'carpeta',
      'curpDrive',
      'boletas',
      'expediente',
      'autorizacion',
      'validacion',
      'fechaArchivo',
    ],
  },
  {
    id: 'devoluciones',
    label: 'Devoluciones',
    columnIds: ['devolucionSn', 'fechaDevolucion', 'observaciones'],
  },
]

export const COLUMN_GROUP_BY_ID: Record<ColumnId, GroupId> = Object.fromEntries(
  COLUMN_GROUPS.flatMap((group) =>
    group.columnIds.map((id) => [id, group.id]),
  ),
) as Record<ColumnId, GroupId>

export const STICKY_COLUMN_IDS: ColumnId[] = ['folio', 'nombre']

/** Alterna blanco / azul claro por orden de sección (0 blanco, 1 azul, …). */
const STRIPE_WHITE = {
  chip: 'bg-sec-white text-ink border-brand-border',
  head: 'bg-sec-white-head text-ink',
  cell: 'bg-sec-white',
}
const STRIPE_BLUE = {
  chip: 'bg-sec-blue text-ink border-sec-blue-head',
  head: 'bg-sec-blue-head text-ink',
  cell: 'bg-sec-blue',
}

export const GROUP_STYLES: Record<
  GroupId,
  { chip: string; head: string; cell: string }
> = {
  identidad: STRIPE_WHITE,
  personales: STRIPE_BLUE,
  pagos: STRIPE_WHITE,
  expediente: STRIPE_BLUE,
  devoluciones: STRIPE_WHITE,
}
