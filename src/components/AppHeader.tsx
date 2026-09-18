import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleInfo, faRotate } from '@fortawesome/free-solid-svg-icons'
import { CICLO_ESCOLAR, CUOTA_ANUAL_USD, formatUsd } from '../lib/constants'
import { NIVELES, type Nivel } from '../types/alumno'

type Props = {
  onHelp: () => void
  nivel: Nivel | 'Todos'
  onNivel: (nivel: Nivel | 'Todos') => void
  onSync: () => void
  syncing?: boolean
}

export function AppHeader({
  onHelp,
  nivel,
  onNivel,
  onSync,
  syncing = false,
}: Props) {
  return (
    <header className="shrink-0 border-b border-brand/20 bg-brand text-on-brand">
      <div className="mx-auto flex w-full flex-wrap items-center justify-between gap-3 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[1.15rem] leading-tight font-bold tracking-tight sm:text-[1.65rem] lg:text-[1.85rem]">
            PROGRAMA WINSTON–HÖKKU ACADEMY
          </h1>
          <p className="mt-0.5 text-[0.7rem] font-semibold tracking-[0.14em] text-on-brand/80 uppercase sm:mt-1 sm:text-sm sm:tracking-[0.18em]">
            Ciclo escolar {CICLO_ESCOLAR}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:gap-3">
          <p className="hidden rounded-full bg-white/5 px-3 py-2 text-sm md:inline-block lg:px-4 lg:py-2.5">
            Cuota anual:{' '}
            <span className="font-semibold">{formatUsd(CUOTA_ANUAL_USD)}</span>
          </p>
          
          <label className="flex items-center gap-2 rounded-full bg-white/5 px-2.5 py-1 text-xs font-semibold tracking-wide uppercase sm:px-3.5 sm:py-2 sm:text-sm">
            Nivel
            <select
              value={nivel}
              onChange={(e) => onNivel(e.target.value as Nivel | 'Todos')}
              className="rounded-2xl border-0 bg-brand/40 px-1.5 py-1.25 text-[0.85rem] border-1 border-white/40
               font-medium text-on-brand normal-case outline-none focus:ring-2 focus:ring-white/30"
            >
              <option value="Todos">Todos</option>
              {NIVELES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          
          <button
            type="button"
            onClick={onSync}
            disabled={syncing}
            title={`Sincronizar pagos del ciclo ${CICLO_ESCOLAR}`}
            aria-label={syncing ? 'Sincronizando pagos' : 'Sincronizar pagos'}
            className="inline-flex size-9 items-center justify-center rounded-full bg-white/5 text-on-brand hover:bg-white/20 disabled:cursor-wait disabled:opacity-60 sm:size-10"
          >
            <FontAwesomeIcon
              icon={faRotate}
              className={`text-base ${syncing ? 'animate-spin' : ''}`}
            />
          </button>
          <button
            type="button"
            onClick={onHelp}
            className="inline-flex items-center gap-2 rounded-full bg-white/5 px-2.5 py-2 text-sm font-semibold hover:bg-white/20 sm:px-4 sm:py-2.5"
            aria-label="Ayuda e instrucciones"
          >
            <span className="hidden sm:inline">Ayuda</span>
            <FontAwesomeIcon icon={faCircleInfo} className="text-lg" />
          </button>
          {/* Theme toggle oculto por ahora; useTheme sigue disponible si se necesita. */}
        </div>
      </div>
    </header>
  )
}
