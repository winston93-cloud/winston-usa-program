import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AlumnoPatch, ChipFiltro, Nivel } from '../types/alumno'
import { chipCounts, filterAlumnos, kpis } from '../lib/pagos'
import { notificarBajaReembolso } from '../lib/notificarBajaReembolso'
import { useAlumnos } from '../store/alumnosStore'
import { useAuth } from '../store/authStore'
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
  } = useAlumnos()
  const { session, logout, canEdit, canValidar, isAdmin } = useAuth()
  const { pushToast } = useToast()
  const [nivel, setNivel] = useState<Nivel | 'Todos'>(() =>
    session?.nivelEditable ?? 'Todos',
  )
  const [chip, setChip] = useState<ChipFiltro>('todos')
  const [search, setSearch] = useState('')
  const [infoOpen, setInfoOpen] = useState(false)

  useEffect(() => {
    if (session?.nivelEditable) setNivel(session.nivelEditable)
  }, [session?.nivelEditable])

  useEffect(() => {
    if (!error) return
    pushToast(error, 'error')
    clearError()
  }, [error, pushToast, clearError])

  const metrics = useMemo(() => kpis(alumnos, nivel), [alumnos, nivel])
  const counts = useMemo(() => chipCounts(alumnos, nivel), [alumnos, nivel])
  const visible = useMemo(
    () => filterAlumnos(alumnos, nivel, chip, search),
    [alumnos, nivel, chip, search],
  )

  const hintSoloLectura =
    !isAdmin &&
    nivel !== 'Todos' &&
    session?.nivelEditable &&
    nivel !== session.nivelEditable

  const onChangeAlumno = useCallback(
    (id: string, patch: AlumnoPatch) => {
      const prev = alumnos.find((a) => a.id === id)
      updateAlumno(id, patch)
      if (
        patch.estado === 'Baja - gestionar devolución' &&
        prev &&
        prev.estado !== 'Baja - gestionar devolución'
      ) {
        void (async () => {
          const result = await notificarBajaReembolso(
            { ...prev, ...patch },
            {
              solicitadoPor:
                session?.email ||
                session?.nombre ||
                session?.usuario ||
                'Panel USA',
            },
          )
          if (result.ok) {
            pushToast(
              `Baja notificada a sistemas@ para reembolso (${prev.folio || prev.nombreCompleto}).`,
              'success',
            )
          } else {
            pushToast(
              result.error ??
                'No se pudo notificar la baja a sistemas@. El cambio de estado sí se guardó.',
              'error',
            )
          }
        })()
      }
    },
    [alumnos, updateAlumno, session, pushToast],
  )

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden">
      <AppHeader
        onHelp={() => setInfoOpen(true)}
        nivel={nivel}
        onNivel={setNivel}
        syncing={syncing}
        session={session!}
        onLogout={logout}
        canSync={isAdmin}
        onSync={() => {
          void (async () => {
            const result = await syncFromPagos()
            if (!result) return
            pushToast(
              `Pagos sincronizados: ${result.alumnos} alumno(s) (${result.inserted} nuevos, ${result.updated} actualizados).`,
              'success',
            )
            setChip('todos')
            if (result.pagosNuevos.length > 0) {
              try {
                const { enviarCartasBienvenidaPorPago } = await import(
                  '../lib/enviarCartaBienvenidaMail'
                )
                const envio = await enviarCartasBienvenidaPorPago(
                  result.pagosNuevos,
                )
                if (envio.ok > 0) {
                  pushToast(
                    `Cartas de bienvenida enviadas: ${envio.ok}.`,
                    'success',
                  )
                  const hoy = new Date().toISOString().slice(0, 10)
                  for (const a of result.pagosNuevos) {
                    if (!a.fechaCorreoBienvenida) {
                      updateAlumno(a.id, { fechaCorreoBienvenida: hoy })
                    }
                  }
                }
                if (envio.fail > 0) {
                  pushToast(
                    `No se enviaron ${envio.fail} carta(s): ${envio.errors.slice(0, 2).join('; ')}`,
                    'error',
                  )
                }
              } catch (e) {
                pushToast(
                  e instanceof Error
                    ? e.message
                    : 'No se pudieron enviar las cartas por correo',
                  'error',
                )
              }
            }
          })()
        }}
      />
      <main className="mx-auto max-w-[1400px] flex min-h-0 w-full flex-1 flex-col gap-2 px-2 py-2 sm:gap-2.5 sm:px-3 sm:py-3 md:px-4 md:py-4 lg:px-5">
        {hintSoloLectura ? (
          <p className="shrink-0 rounded-lg border border-brand-border bg-brand-soft/80 px-3 py-1.5 text-xs text-ink-muted">
            Solo lectura en {nivel}. Puede editar el nivel{' '}
            {session?.nivelEditable}.
          </p>
        ) : null}
        <StatusChips
          chip={chip}
          onChip={setChip}
          search={search}
          onSearch={setSearch}
          data={metrics}
          showing={
            loading
              ? 'Cargando alumnos…'
              : `Mostrando ${visible.length} de ${counts.todos} ${counts.todos === 1 ? 'alumno' : 'alumnos'}`
          }
        />
        <AlumnosTable
          alumnos={visible}
          onChange={onChangeAlumno}
          canEditNivel={canEdit}
          canValidar={canValidar}
        />
      </main>
      <InstructionsModal
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
      />
    </div>
  )
}
