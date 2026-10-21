import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Alumno, AlumnoPatch, ChipFiltro, Nivel } from '../types/alumno'
import { isAlumnoPrueba } from '../lib/alumnoPrueba'
import { chipCounts, filterAlumnos, kpis } from '../lib/pagos'
import { notificarBajaReembolso } from '../lib/notificarBajaReembolso'
import { hoyMexicoCity } from '../lib/vencimientosPagos'
import { useAlumnos, type SyncPagosResult } from '../store/alumnosStore'
import { useAuth } from '../store/authStore'
import { AlumnosTable } from './AlumnosTable'
import { AppHeader } from './AppHeader'
import { InstructionsModal } from './InstructionsModal'
import { StatusChips } from './StatusChips'
import { useToast } from './Toast'

/** Evita doble envío de cartas en Strict Mode / remount. */
let autoSyncSesionHecho = false
const cartasEnCurso = new Set<string>()

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

  const enviarPendientesCarta = useCallback(
    async (pendientes: Alumno[]) => {
      const batch = pendientes.filter(
        (a) =>
          !isAlumnoPrueba(a.id) &&
          Boolean(a.fechaPago1?.trim()) &&
          !a.fechaCorreoBienvenida?.trim() &&
          !cartasEnCurso.has(a.id),
      )
      if (batch.length === 0) return
      for (const a of batch) cartasEnCurso.add(a.id)
      try {
        const { enviarCartasBienvenidaPorPago } = await import(
          '../lib/enviarCartaBienvenidaMail'
        )
        const envio = await enviarCartasBienvenidaPorPago(batch)
        const hoy = hoyMexicoCity()
        for (const r of envio.results) {
          if (r.skipped) continue
          if (r.ok) {
            updateAlumno(r.id, { fechaCorreoBienvenida: hoy })
          } else {
            cartasEnCurso.delete(r.id)
          }
        }
        if (envio.ok > 0) {
          pushToast(`Cartas de bienvenida enviadas: ${envio.ok}.`, 'success')
        }
        if (envio.fail > 0) {
          pushToast(
            `No se enviaron ${envio.fail} carta(s): ${envio.errors.slice(0, 2).join('; ')}`,
            'error',
          )
        }
      } catch (e) {
        for (const a of batch) cartasEnCurso.delete(a.id)
        pushToast(
          e instanceof Error
            ? e.message
            : 'No se pudieron enviar las cartas por correo',
          'error',
        )
      }
    },
    [pushToast, updateAlumno],
  )

  const correrSync = useCallback(
    async (opts?: { silencioso?: boolean }) => {
      const result: SyncPagosResult | null = await syncFromPagos()
      if (!result) return
      if (!opts?.silencioso) {
        pushToast(
          `Pagos sincronizados: ${result.alumnos} alumno(s) (${result.inserted} nuevos, ${result.updated} actualizados).`,
          'success',
        )
        setChip('todos')
      } else if (result.inserted > 0 || result.updated > 0) {
        pushToast(
          `Pagos del ciclo: ${result.alumnos} alumno(s) (${result.inserted} nuevos).`,
          'success',
        )
      }
      await enviarPendientesCarta(result.pendientesCarta)
    },
    [syncFromPagos, pushToast, enviarPendientesCarta],
  )

  useEffect(() => {
    if (session?.nivelEditable) setNivel(session.nivelEditable)
  }, [session?.nivelEditable])

  useEffect(() => {
    if (autoSyncSesionHecho || !isAdmin || loading) return
    autoSyncSesionHecho = true
    void correrSync({ silencioso: true })
  }, [isAdmin, loading, correrSync])

  useEffect(() => {
    if (!isAdmin || loading) return
    const pendientes = alumnos.filter(
      (a) =>
        !isAlumnoPrueba(a.id) &&
        Boolean(a.fechaPago1?.trim()) &&
        !a.fechaCorreoBienvenida?.trim(),
    )
    if (pendientes.length === 0) return
    void enviarPendientesCarta(pendientes)
  }, [isAdmin, loading, alumnos, enviarPendientesCarta])

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
          void correrSync()
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
