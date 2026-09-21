import { useEffect, useMemo, useState } from 'react'
import type { ChipFiltro, Nivel } from '../types/alumno'
import { chipCounts, filterAlumnos, kpis } from '../lib/pagos'
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
    resetSeed,
    addAlumnoPrueba,
  } = useAlumnos()
  const { session, logout, canEdit, isAdmin } = useAuth()
  const { pushToast } = useToast()
  const [nivel, setNivel] = useState<Nivel | 'Todos'>(() =>
    session?.nivelEditable ?? 'Todos',
  )
  const [chip, setChip] = useState<ChipFiltro>('todos')
  const [infoOpen, setInfoOpen] = useState(false)
  const [pruebaBusy, setPruebaBusy] = useState(false)

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
    () => filterAlumnos(alumnos, nivel, chip),
    [alumnos, nivel, chip],
  )

  const hintSoloLectura =
    !isAdmin &&
    nivel !== 'Todos' &&
    session?.nivelEditable &&
    nivel !== session.nivelEditable

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-brand-soft">
      <AppHeader
        onHelp={() => setInfoOpen(true)}
        nivel={nivel}
        onNivel={setNivel}
        syncing={syncing}
        session={session!}
        onLogout={logout}
        canSync={isAdmin}
        onPrueba={
          isAdmin
            ? () => {
                void (async () => {
                  setPruebaBusy(true)
                  try {
                    const nivelPrueba: Nivel =
                      nivel === 'Todos' ? 'Primaria' : nivel
                    const alumno = addAlumnoPrueba(nivelPrueba)
                    setChip('todos')
                    pushToast(
                      `Alumno prueba en tabla (${alumno.folio}) — no guardado en BD.`,
                      'success',
                    )

                    const { enviarCartaBienvenidaPorCorreo } = await import(
                      '../lib/enviarCartaBienvenidaMail'
                    )
                    const carta = await enviarCartaBienvenidaPorCorreo(alumno)
                    if (carta.ok) {
                      updateAlumno(alumno.id, {
                        fechaCorreoBienvenida: new Date()
                          .toISOString()
                          .slice(0, 10),
                      })
                      pushToast(
                        `Carta CE enviada a ${carta.to ?? 'prueba'}.`,
                        'success',
                      )
                    } else {
                      pushToast(
                        `Carta: ${carta.error ?? 'falló el envío'}`,
                        'error',
                      )
                    }

                    const alertaRes = await fetch('/api/enviar-alerta-prueba', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        alumnoNombre: alumno.nombreCompleto,
                        folio: alumno.folio,
                        nivel: alumno.nivel,
                        parcialidad: 2,
                        diasAntes: 10,
                      }),
                    })
                    const alerta = (await alertaRes.json().catch(() => ({}))) as {
                      ok?: boolean
                      error?: string
                      to?: string
                    }
                    if (alertaRes.ok && alerta.ok) {
                      pushToast(
                        `Aviso (avisos_no-replay) → ${alerta.to ?? 'prueba'}.`,
                        'success',
                      )
                    } else {
                      pushToast(
                        `Aviso: ${alerta.error ?? 'falló (¿MAIL_PASS?)'}`,
                        'error',
                      )
                    }
                  } catch (e) {
                    pushToast(
                      e instanceof Error ? e.message : 'Error en prueba',
                      'error',
                    )
                  } finally {
                    setPruebaBusy(false)
                  }
                })()
              }
            : undefined
        }
        pruebaBusy={pruebaBusy}
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
                    `Cartas enviadas (prueba → sistemas.desarrollo): ${envio.ok}.`,
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
          canEditNivel={canEdit}
        />
      </main>
      <InstructionsModal
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        onReset={resetSeed}
        canReset={isAdmin}
      />
    </div>
  )
}
