import { useEffect, useMemo, useState } from 'react'
import type { ChipFiltro, Nivel } from '../types/alumno'
import { chipCounts, filterAlumnos, kpis } from '../lib/pagos'
import { useAlumnos } from '../store/alumnosStore'
import { AlumnosTable } from './AlumnosTable'
import { AppHeader } from './AppHeader'
import { InstructionsModal } from './InstructionsModal'
import { StatusChips } from './StatusChips'
import { useToast } from './Toast'

export function Dashboard() {
  const {
    alumnos,
    loading,
    syncing,
    error,
    clearError,
    updateAlumno,
    syncFromPagos,
    resetSeed,
  } = useAlumnos()
  const { pushToast } = useToast()
  const [nivel, setNivel] = useState<Nivel | 'Todos'>('Todos')
  const [chip, setChip] = useState<ChipFiltro>('todos')
  const [infoOpen, setInfoOpen] = useState(false)

  useEffect(() => {
    if (!error) return
    pushToast(error, 'error')
    clearError()
  }, [error, pushToast, clearError])

  const metrics = useMemo(() => kpis(alumnos, nivel), [alumnos, nivel])
  const counts = useMemo(() => chipCounts(alumnos, nivel), [alumnos, nivel])
  const visible = useMemo(
    () => filterAlumnos(alumnos, nivel, chip),
    [alumnos, nivel, chip],
  )

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-brand-soft">
      <AppHeader
        onHelp={() => setInfoOpen(true)}
        nivel={nivel}
        onNivel={setNivel}
        syncing={syncing}
        onSync={() => {
          void (async () => {
            const result = await syncFromPagos()
            if (!result) return
            pushToast(
              `Pagos sincronizados: ${result.alumnos} alumno(s) (${result.inserted} nuevos, ${result.updated} actualizados).`,
              'success',
            )
            setChip('todos')
            if (result.nuevos.length > 0) {
              try {
                const { generateAndDownloadCartas } = await import(
                  '../lib/generateCartaBienvenida'
                )
                const files = await generateAndDownloadCartas(result.nuevos)
                if (files.length > 0) {
                  pushToast(
                    `Cartas de bienvenida generadas: ${files.length} (descarga local; sin correo).`,
                    'success',
                  )
                }
              } catch (e) {
                pushToast(
                  e instanceof Error
                    ? e.message
                    : 'No se pudieron generar las cartas PDF',
                  'error',
                )
              }
            }
          })()
        }}
      />
      <main className="mx-auto max-w-[1400px] flex min-h-0 w-full flex-1 flex-col gap-2 px-2 py-2 sm:gap-2.5 sm:px-3 sm:py-3 md:px-4 md:py-4 lg:px-5">
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
