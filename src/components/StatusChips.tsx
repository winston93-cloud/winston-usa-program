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
 * Anchos relativos de cada chip (flex-grow) en desktop.
 * En móvil los chips hacen scroll horizontal a tamaño natural.
 */
const CHIP_FLEX_GROW: Record<ChipFiltro, number> = {
  todos: 0.9,
  inscritos: 1.35,
  activos: 1,
  liquidados: 1.1,
  archivo: 1.55,
  devoluciones: 1.6,
}

const CHIP_GAP_CLASS = 'gap-2'

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
    <div className="shrink-0 space-y-2">
      {/*
        Móvil: scroll horizontal (chips a tamaño natural).
        md+: fila a ancho completo con flex-grow proporcional.
      */}
      <div
        className={`-mx-1 flex w-[calc(100%+0.5rem)] items-stretch overflow-x-auto px-1 pb-0.5 md:mx-0 md:w-full md:overflow-visible md:px-0 md:pb-0 ${CHIP_GAP_CLASS}`}
      >
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
              className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-[0.65rem] font-semibold tracking-wide uppercase sm:gap-2 sm:text-xs md:min-w-0 md:shrink ${
                selected ? style.active : style.idle
              }`}
            >
              <span
                className={`size-2 shrink-0 rounded-full ${selected ? 'bg-on-brand' : style.dot}`}
              />
              <span className="whitespace-nowrap md:truncate">
                {CHIP_LABELS[id]}
              </span>
              <span className="shrink-0 rounded-full bg-black/10 px-2 py-0.5 text-[11px] tabular-nums normal-case">
                {data[key]}
              </span>
            </button>
          )
        })}
      </div>
      <div className="flex flex-col gap-1 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2 sm:text-[0.95rem]">
        <p className="text-ink-muted">{showing}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <p className="text-ink">
            Recaudado:{' '}
            <span className="font-semibold text-chip-recaudado">
              {formatUsd(data.recaudado)}
            </span>
          </p>
          <p className="text-ink">
            Saldo:{' '}
            <span className="font-semibold text-chip-saldo">
              {formatUsd(data.saldoPendiente)}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
