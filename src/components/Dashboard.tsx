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
  const { alumnos, updateAlumno, addAlumno, resetSeed } = useAlumnos()
  const [nivel, setNivel] = useState<Nivel | 'Todos'>('Todos')
  const [chip, setChip] = useState<ChipFiltro>('todos')
  const [infoOpen, setInfoOpen] = useState(false)

  const metrics = useMemo(() => kpis(alumnos, nivel), [alumnos, nivel])
  const counts = useMemo(() => chipCounts(alumnos, nivel), [alumnos, nivel])
  const visible = useMemo(
    () => filterAlumnos(alumnos, nivel, chip),
    [alumnos, nivel, chip],
  )

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-brand-soft">
      <AppHeader onHelp={() => setInfoOpen(true)} />
      <main className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-2.5 px-1 py-5 sm:px-0">
        <FilterBar
          nivel={nivel}
          onNivel={setNivel}
          onAdd={() => {
            addAlumno()
            setChip('todos')
          }}
        />
        <StatusChips
          chip={chip}
          onChip={setChip}
          data={metrics}
          showing={`Mostrando ${visible.length} de ${counts.todos} ${counts.todos === 1 ? 'alumno' : 'alumnos'}`}
        />
        <AlumnosTable alumnos={visible} onChange={updateAlumno} />
      </main>
      <InstructionsModal
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        onReset={resetSeed}
      />
    </div>
  )
}
