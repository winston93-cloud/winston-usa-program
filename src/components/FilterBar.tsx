import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faRotate } from '@fortawesome/free-solid-svg-icons'
import { CICLO_ESCOLAR } from '../lib/constants'
import { NIVELES, type Nivel } from '../types/alumno'

type Props = {
  nivel: Nivel | 'Todos'
  onNivel: (nivel: Nivel | 'Todos') => void
  onAdd: () => void
  onSync: () => void
  syncing?: boolean
}

export function FilterBar({
  nivel,
  onNivel,
  onAdd,
  onSync,
  syncing = false,
}: Props) {
  return (
    <div className="flex shrink-0 flex-col gap-2 rounded-xl border border-brand-border bg-cell px-3 py-2 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:px-4">
      <label className="flex items-center gap-2.5 text-sm font-semibold tracking-wide text-ink-muted uppercase">
        Nivel
        <select
          value={nivel}
          onChange={(e) => onNivel(e.target.value as Nivel | 'Todos')}
          className="min-w-0 flex-1 rounded-lg border border-brand-border bg-cell px-2 py-1.5 text-[0.95rem] font-medium text-ink normal-case outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-muted sm:flex-none"
        >
          <option value="Todos">Todos</option>
          {NIVELES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <div className="flex w-full gap-2 sm:ml-auto sm:w-auto sm:flex-wrap">
        <button
          type="button"
          onClick={onSync}
          disabled={syncing}
          title={`Importar pagos 23/24/25 del ciclo ${CICLO_ESCOLAR}`}
          className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-brand-border bg-cell px-3 py-2 text-sm font-semibold text-ink hover:bg-brand-soft disabled:cursor-wait disabled:opacity-60 sm:flex-none sm:px-4 sm:text-[0.95rem]"
        >
          <FontAwesomeIcon icon={faRotate} className={syncing ? 'animate-spin' : ''} />
          <span className="truncate">
            {syncing ? 'Sincronizando…' : 'Sincronizar'}
          </span>
        </button>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-on-brand hover:bg-brand-hover sm:flex-none sm:px-4 sm:text-[0.95rem]"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span className="truncate">Agregar</span>
        </button>
      </div>
    </div>
  )
}
