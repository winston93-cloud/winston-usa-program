import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCircleInfo,
  faRightFromBracket,
  faRotate,
} from '@fortawesome/free-solid-svg-icons'
import { CICLO_ESCOLAR, CUOTA_ANUAL_USD, formatUsd } from '../lib/constants'
import { shortSessionName, type UsaSession } from '../lib/authAccess'
import { NIVELES, type Nivel } from '../types/alumno'

type Props = {
  onHelp: () => void
  nivel: Nivel | 'Todos'
  onNivel: (nivel: Nivel | 'Todos') => void
  onSync: () => void
  syncing?: boolean
  session: UsaSession
  onLogout: () => void
  canSync?: boolean
}

/** Controles del header: mismo alto (salvo título/subtítulo). Texto secundario en azul opaco. */
const chrome =
  'inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-sm font-semibold text-sky-200/85 transition-[background-color,color] duration-150 hover:bg-white/15 hover:text-sky-100'

const iconBtn =
  'inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sky-200/85 transition-[background-color,color] duration-150 hover:bg-white/15 hover:text-sky-100 disabled:cursor-wait disabled:opacity-60'

export function AppHeader({
  onHelp,
  nivel,
  onNivel,
  onSync,
  syncing = false,
  session,
  onLogout,
  canSync = true,
}: Props) {
  const nombreCorto = shortSessionName(session)

  return (
    <header className="shrink-0 border-b border-brand-border bg-[rgba(26,27,33,0.78)] text-on-brand shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-xl">
      <div className="mx-auto flex w-full flex-wrap items-center justify-between gap-3 px-3 py-3 sm:gap-3 sm:px-5">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-lg leading-tight font-bold tracking-tight text-ink sm:text-xl">
            PROGRAMA WINSTON–HÖKKU ACADEMY
          </h1>
          <p className="mt-0.5 text-[0.7rem] font-semibold tracking-[0.14em] text-ink-muted uppercase sm:text-xs sm:tracking-[0.16em]">
            Ciclo escolar {CICLO_ESCOLAR}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <p className={`hidden md:inline-flex ${chrome}`}>
            Cuota anual:{' '}
            <span className="font-semibold tabular-nums text-sky-100">
              {formatUsd(CUOTA_ANUAL_USD)}
            </span>
          </p>

          <label className={chrome}>
            <span className="tracking-wide uppercase">Nivel</span>
            <select
              value={nivel}
              onChange={(e) => onNivel(e.target.value as Nivel | 'Todos')}
              className="h-7 rounded-md border border-white/20 bg-[#0d0e13] px-2 text-sm font-medium text-sky-100 normal-case outline-none focus:ring-2 focus:ring-white/25"
            >
              <option value="Todos">Todos</option>
              {NIVELES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          {canSync ? (
            <button
              type="button"
              onClick={onSync}
              disabled={syncing}
              title={`Sincronizar pagos del ciclo ${CICLO_ESCOLAR}`}
              aria-label={syncing ? 'Sincronizando pagos' : 'Sincronizar pagos'}
              className={iconBtn}
            >
              <FontAwesomeIcon
                icon={faRotate}
                className={`text-sm ${syncing ? 'animate-spin' : ''}`}
                aria-hidden
              />
            </button>
          ) : null}

          <button
            type="button"
            onClick={onHelp}
            className={chrome}
            aria-label="Ayuda e instrucciones"
          >
            <span className="hidden sm:inline">Ayuda</span>
            <FontAwesomeIcon icon={faCircleInfo} className="text-sm" aria-hidden />
          </button>

          <div
            className="inline-flex h-10 max-w-[8.5rem] flex-col justify-center rounded-lg border border-white/10 bg-white/10 px-3"
            title={`${session.label} · ${session.nombre} · ${session.email}`}
          >
            <span className="truncate text-[0.65rem] font-semibold tracking-wide text-sky-200/70 uppercase">
              {session.label}
            </span>
            <span className="truncate text-sm font-semibold text-sky-100">
              {nombreCorto}
            </span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className={iconBtn}
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="text-sm" aria-hidden />
          </button>
        </div>
      </div>
    </header>
  )
}
