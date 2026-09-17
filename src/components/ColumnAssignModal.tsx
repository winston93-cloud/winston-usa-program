import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import {
  COLUMN_GROUPS,
  GROUP_STYLES,
  TABLE_COLUMNS,
  type ColumnId,
  type GroupId,
} from '../lib/tableColumns'

type Props = {
  open: boolean
  assignments: Record<ColumnId, GroupId>
  onAssign: (columnId: ColumnId, groupId: GroupId) => void
  onClose: () => void
}

export function ColumnAssignModal({
  open,
  assignments,
  onAssign,
  onClose,
}: Props) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="columnas-titulo"
        className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-brand-border bg-cell p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2
              id="columnas-titulo"
              className="font-display text-xl font-semibold text-brand-on-surface"
            >
              Asignar columnas a secciones
            </h2>
            <p className="mt-1 text-[0.95rem] text-ink-muted">
              Elija a qué sección pertenece cada columna. Folio y nombre
              completo se quedan fijos al desplazar la tabla.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-md text-ink-muted hover:bg-brand-soft"
            aria-label="Cerrar"
          >
            <FontAwesomeIcon icon={faXmark} className="text-lg" />
          </button>
        </div>
        <div className="space-y-4">
          {COLUMN_GROUPS.map((group) => {
            const cols = TABLE_COLUMNS.filter(
              (col) => assignments[col.id] === group.id,
            )
            return (
              <section
                key={group.id}
                className={`rounded-lg border p-3 ${GROUP_STYLES[group.id].chip}`}
              >
                <h3 className="mb-2.5 text-sm font-semibold tracking-[0.04em] uppercase">
                  {group.label}
                </h3>
                {cols.length === 0 ? (
                  <p className="text-sm text-ink-muted">Sin columnas</p>
                ) : (
                  <ul className="space-y-2">
                    {cols.map((col) => (
                      <li
                        key={col.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-cell/80 px-2.5 py-2"
                      >
                        <span className="text-[0.95rem] text-ink">{col.label}</span>
                        <select
                          value={assignments[col.id]}
                          onChange={(e) =>
                            onAssign(col.id, e.target.value as GroupId)
                          }
                          className="rounded-lg border border-brand-border bg-cell px-2.5 py-1.5 text-sm text-ink"
                        >
                          {COLUMN_GROUPS.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
