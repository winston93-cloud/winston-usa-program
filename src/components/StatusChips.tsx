import { CHIP_HINTS, CHIP_LABELS, formatUsd } from '../lib/constants'
import type { ChipFiltro } from '../types/alumno'
import type { KpiData } from './KpiBar'

const FILTER_CHIPS: {
  id: ChipFiltro
  key: keyof KpiData
  color: string
}[] = [
  { id: 'todos', key: 'total', color: 'chip-todos' },
  { id: 'inscritos', key: 'inscritos', color: 'chip-inscritos' },
  { id: 'activos', key: 'activos', color: 'chip-activos' },
  { id: 'liquidados', key: 'liquidados', color: 'chip-liquidados' },
  { id: 'archivo', key: 'archivo', color: 'chip-archivo' },
  { id: 'devoluciones', key: 'devoluciones', color: 'chip-devoluciones' },
]

/**
 * Anchos relativos de cada chip (flex-grow).
 * Edita estos números para que una chip ocupe más o menos espacio:
 * - 1 = base
 * - 1.4 = un poco más ancha
 * - 2 = el doble que la base
 * El gap fijo se define abajo en CHIP_GAP_CLASS.
 */
const CHIP_FLEX_GROW: Record<ChipFiltro, number> = {
  todos: 0.9,
  inscritos: 1.35,
  activos: 1,
  liquidados: 1.1,
  archivo: 1.55,
  devoluciones: 1.6,
}

/** Gap horizontal fijo entre chips. Cambia gap-2 / gap-3 / gap-4 según necesites. */
const CHIP_GAP_CLASS = 'gap-2.5'

/*
  Colores de chips: usan tokens --color-chip-* de src/index.css
  (idle = borde suave + texto del color; active = fondo sólido + texto on-brand).
*/
const CHIP_STYLE: Record<string, { idle: string; active: string; dot: string }> =
  {
    'chip-todos': {
      idle: 'border-chip-todos/30 bg-cell text-chip-todos',
      active: 'border-chip-todos bg-chip-todos text-on-brand',
      dot: 'bg-chip-todos',
    },
    'chip-inscritos': {
      idle: 'border-chip-inscritos/30 bg-cell text-chip-inscritos',
      active: 'border-chip-inscritos bg-chip-inscritos text-on-brand',
      dot: 'bg-chip-inscritos',
    },
    'chip-activos': {
      idle: 'border-chip-activos/30 bg-cell text-chip-activos',
      active: 'border-chip-activos bg-chip-activos text-on-brand',
      dot: 'bg-chip-activos',
    },
    'chip-liquidados': {
      idle: 'border-chip-liquidados/30 bg-cell text-chip-liquidados',
      active: 'border-chip-liquidados bg-chip-liquidados text-on-brand',
      dot: 'bg-chip-liquidados',
    },
    'chip-archivo': {
      idle: 'border-chip-archivo/30 bg-cell text-chip-archivo',
      active: 'border-chip-archivo bg-chip-archivo text-on-brand',
      dot: 'bg-chip-archivo',
    },
    'chip-devoluciones': {
      idle: 'border-chip-devoluciones/30 bg-cell text-chip-devoluciones',
      active: 'border-chip-devoluciones bg-chip-devoluciones text-on-brand',
      dot: 'bg-chip-devoluciones',
    },
  }

type Props = {
  chip: ChipFiltro
  onChip: (chip: ChipFiltro) => void
  data: KpiData
  showing: string
}

export function StatusChips({ chip, onChip, data, showing }: Props) {
  return (
    <div className="space-y-2.5">
      {/*
        Fila de chips a ancho completo:
        - w-full + flex para repartir todo el ancho disponible
        - CHIP_GAP_CLASS = separación fija entre chips
        - CHIP_FLEX_GROW[id] = proporción de ancho de cada chip
      */}
      <div className={`flex w-full items-stretch ${CHIP_GAP_CLASS}`}>
        {FILTER_CHIPS.map(({ id, key, color }) => {
          const selected = chip === id
          const style = CHIP_STYLE[color]
          return (
            <button
              key={id}
              type="button"
              title={CHIP_HINTS[id]}
              onClick={() => onChip(id)}
              style={{ flexGrow: CHIP_FLEX_GROW[id], flexBasis: 0 }}
              className={`inline-flex min-w-0 items-center justify-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold tracking-wide uppercase ${
                selected ? style.active : style.idle
              }`}
            >
              <span
                className={`size-2 shrink-0 rounded-full ${selected ? 'bg-on-brand' : style.dot}`}
              />
              <span className="truncate">{CHIP_LABELS[id]}</span>
              <span className="shrink-0 rounded-full bg-black/10 px-2 py-0.5 text-[11px] tabular-nums normal-case">
                {data[key]}
              </span>
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-[0.95rem]">
        <p className="text-ink-muted">{showing}</p>
        <div className="flex flex-wrap items-center gap-5">
          <p className="text-ink">
            Recaudado:{' '}
            <span className="font-semibold text-chip-recaudado">
              {formatUsd(data.recaudado)}
            </span>
          </p>
          <p className="text-ink">
            Saldo pendiente:{' '}
            <span className="font-semibold text-chip-saldo">
              {formatUsd(data.saldoPendiente)}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
