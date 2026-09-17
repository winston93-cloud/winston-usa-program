import { useMemo, useState } from 'react'
import type { ChipFiltro, Nivel } from '../types/alumno'
import { chipCounts, filterAlumnos, kpis } from '../lib/pagos'
import { useAlumnos } from '../store/alumnosStore'
import { AlumnosTable } from './AlumnosTable'
import { AppHeader } from './AppHeader'
import { FilterBar } from './FilterBar'
import { InstructionsModal } from './InstructionsModal'
import { StatusChips } from './StatusChips'

export function Dashboard() {
  const {
    alumnos,
    loading,
    syncing,
    error,
    updateAlumno,
    applyAlumnoRef,
    syncFromPagos,
    addAlumno,
    resetSeed,
  } = useAlumnos()
  const [nivel, setNivel] = useState<Nivel | 'Todos'>('Todos')
  const [chip, setChip] = useState<ChipFiltro>('todos')
  const [infoOpen, setInfoOpen] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)

  const metrics = useMemo(() => kpis(alumnos, nivel), [alumnos, nivel])
  const counts = useMemo(() => chipCounts(alumnos, nivel), [alumnos, nivel])
  const visible = useMemo(
    () => filterAlumnos(alumnos, nivel, chip),
    [alumnos, nivel, chip],
  )

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-brand-soft">
      <AppHeader onHelp={() => setInfoOpen(true)} />
      <main className="mx-auto flex min-h-0 w-full flex-1 flex-col gap-2 px-2 py-2 sm:gap-2.5 sm:px-3 sm:py-3 md:px-4 md:py-4 lg:px-5">
        {error ? (
          <p className="shrink-0 rounded-lg border border-baja-border bg-baja px-3 py-2 text-sm text-baja-text">
            {error}
          </p>
        ) : null}
        {syncMsg ? (
          <p className="shrink-0 rounded-lg border border-brand-border bg-cell px-3 py-2 text-sm text-ink">
            {syncMsg}
          </p>
        ) : null}
        <FilterBar
          nivel={nivel}
          onNivel={setNivel}
          syncing={syncing}
          onSync={() => {
            void (async () => {
              setSyncMsg(null)
              const result = await syncFromPagos()
              if (!result) return
              setSyncMsg(
                `Pagos sincronizados: ${result.alumnos} alumno(s) (${result.inserted} nuevos, ${result.updated} actualizados).`,
              )
              setChip('todos')
            })()
          }}
          onAdd={() => {
            addAlumno()
            setChip('todos')
          }}
        />
        <StatusChips
          chip={chip}
          onChip={setChip}
          data={metrics}
          showing={
            loading
              ? 'Cargando alumnos…'
              : `Mostrando ${visible.length} de ${counts.todos} ${counts.todos === 1 ? 'alumno' : 'alumnos'}`
          }
        />
        <AlumnosTable
          alumnos={visible}
          onChange={updateAlumno}
          onAlumnoRef={(id, alumnoRef) => {
            void applyAlumnoRef(id, alumnoRef)
          }}
        />
      </main>
      <InstructionsModal
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        onReset={resetSeed}
      />
    </div>
  )
}
