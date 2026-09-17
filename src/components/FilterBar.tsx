import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { NIVELES, type Nivel } from '../types/alumno'

type Props = {
  nivel: Nivel | 'Todos'
  onNivel: (nivel: Nivel | 'Todos') => void
  onAdd: () => void
}

export function FilterBar({ nivel, onNivel, onAdd }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-border bg-cell px-4 py-2 shadow-sm">
      <label className="flex items-center gap-2.5 text-sm font-semibold tracking-wide text-ink-muted uppercase">
        Nivel
        <select
          value={nivel}
          onChange={(e) => onNivel(e.target.value as Nivel | 'Todos')}
          className="rounded-lg border border-brand-border bg-cell px-2 py-1 text-[0.95rem] font-medium text-ink normal-case outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-muted"
        >
          <option value="Todos">Todos</option>
          {NIVELES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <div className="ml-auto flex gap-2">
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-[0.95rem] font-semibold text-on-brand hover:bg-brand-hover"
        >
          <FontAwesomeIcon icon={faPlus} />
          Agregar alumno
        </button>
      </div>
    </div>
  )
}
