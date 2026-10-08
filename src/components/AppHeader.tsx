import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCircleInfo,
  faRightFromBracket,
  faRotate,
} from '@fortawesome/free-solid-svg-icons'
import logo from '../assets/logo_winston.png'
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

/** Mismo chip que el bloque de usuario (accent-2 fill). */
const chrome =
  'inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--tone-border-strong)] bg-[rgba(122,147,247,0.2)] px-3 text-sm font-semibold text-title transition-[border-color,background-color] duration-150 hover:border-[var(--tone-accent-ring)] hover:bg-[rgba(122,147,247,0.3)]'

const iconBtn =
  'inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-[var(--tone-border-strong)] bg-[rgba(122,147,247,0.2)] text-title transition-[border-color,background-color] duration-150 hover:border-[var(--tone-accent-ring)] hover:bg-[rgba(122,147,247,0.3)] disabled:cursor-wait disabled:opacity-60'

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
    <header className="surface-header shrink-0 border-b text-on-brand backdrop-blur-xl">
      <div className="mx-auto flex w-full flex-wrap items-center justify-between gap-3 px-3 py-3 sm:gap-3 sm:px-5">
        <div className="flex min-w-0 flex-1 items-center gap-5">
          <img src={logo} alt="Winston" className="h-10 w-auto shrink-0 sm:h-12" />
          <div className="min-w-0">
            <h1 className="font-display text-lg leading-tight font-bold tracking-tight text-title sm:text-xl">
              PROGRAMA USA
            </h1>
            <p className="mt-0.5 text-[0.7rem] font-semibold tracking-[0.14em] text-ink-muted uppercase sm:text-xs sm:tracking-[0.16em]">
              Ciclo escolar {CICLO_ESCOLAR}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <p className={`hidden md:inline-flex ${chrome}`}>
            Cuota anual:{' '}
            <span className="font-semibold tabular-nums text-title">
              {formatUsd(CUOTA_ANUAL_USD)}
            </span>
          </p>

          <label className={chrome}>
            <span className="tracking-wide uppercase">Nivel</span>
            <select
              value={nivel}
              onChange={(e) => onNivel(e.target.value as Nivel | 'Todos')}
              className="h-7 rounded-md border border-[var(--tone-border-strong)] bg-[rgba(16,24,38,0.55)] px-2 text-sm font-medium text-title normal-case outline-none focus:border-[var(--tone-accent)]"
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
            className={`${chrome} max-w-[8.5rem] flex-col justify-center gap-0!`}
            title={`${session.label} · ${session.nombre} · ${session.email}`}
          >
            <span className="truncate text-[0.65rem] font-semibold tracking-wide text-ink-muted uppercase">
              {session.label}
            </span>
            <span className="truncate text-sm font-semibold text-title">
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
