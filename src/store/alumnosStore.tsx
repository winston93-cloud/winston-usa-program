import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  lookupToLink,
  patchToRow,
  rowToAlumno,
  type AlumnoLookup,
  type AlumnoRow,
} from '../lib/alumnoMapper'
import { crearAlumnoPrueba, isAlumnoPrueba } from '../lib/alumnoPrueba'
import { CICLO_NUMERO } from '../lib/constants'
import { insforge, isInsforgeConfigured } from '../lib/insforge'
import type { Alumno, AlumnoPatch, Nivel } from '../types/alumno'

export type SyncPagosResult = {
  inserted: number
  updated: number
  alumnos: number
  /** Filas nuevas tras el sync. */
  nuevos: Alumno[]
  /** Primer pago recién detectado → generar y enviar carta. */
  pagosNuevos: Alumno[]
}

const TABLE = 'usa_programa_alumno'

function mergeConPruebas(list: Alumno[], prev: Alumno[]): Alumno[] {
  const pruebas = prev.filter((a) => isAlumnoPrueba(a.id))
  return pruebas.length ? [...list, ...pruebas] : list
}

type StoreValue = {
  alumnos: Alumno[]
  loading: boolean
  syncing: boolean
  error: string | null
  clearError: () => void
  updateAlumno: (id: string, patch: AlumnoPatch) => void
  /** Enlaza alumno_id por alumno_ref; identidad se lee de public.alumno. */
  applyAlumnoRef: (id: string, alumnoRef: string) => Promise<void>
  syncFromPagos: () => Promise<SyncPagosResult | null>
  resetSeed: () => void
  /** Fila local de prueba (no InsForge). */
  addAlumnoPrueba: (nivel: Nivel) => Alumno
}

const AlumnosContext = createContext<StoreValue | null>(null)

export function AlumnosProvider({ children }: { children: ReactNode }) {
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!isInsforgeConfigured) {
      setError('InsForge no configurado (INSFORGE_URL / INSFORGE_ANON_KEY).')
      setAlumnos((prev) => prev.filter((a) => isAlumnoPrueba(a.id)))
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error: err } = await insforge.database.rpc('usa_programa_list')

    if (err) {
      setError(err.message ?? 'Error al cargar registros del programa')
      setAlumnos((prev) => prev.filter((a) => isAlumnoPrueba(a.id)))
    } else {
      setError(null)
      const list = ((data ?? []) as AlumnoRow[]).map(rowToAlumno)
      setAlumnos((prev) => mergeConPruebas(list, prev))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const clearError = useCallback(() => setError(null), [])

  const addAlumnoPrueba = useCallback((nivel: Nivel) => {
    const row = crearAlumnoPrueba(nivel)
    setAlumnos((prev) => [row, ...prev])
    return row
  }, [])

  const updateAlumno = useCallback(
    (id: string, patch: AlumnoPatch) => {
      setAlumnos((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...patch } : a)),
      )
      if (isAlumnoPrueba(id)) return
      const rowPatch = patchToRow(patch)
      if (Object.keys(rowPatch).length === 0) return
      void (async () => {
        const { error: err } = await insforge.database
          .from(TABLE)
          .update(rowPatch)
          .eq('id', id)
        if (err) {
          setError(err.message ?? 'Error al guardar')
          await refresh()
        }
      })()
    },
    [refresh],
  )

  const applyAlumnoRef = useCallback(
    async (id: string, alumnoRef: string) => {
      if (isAlumnoPrueba(id)) {
        updateAlumno(id, { alumnoRef: alumnoRef.trim() })
        return
      }
      const raw = alumnoRef.trim()
      updateAlumno(id, { alumnoRef: raw })
      if (!raw) return

      const refNum = Number.parseInt(raw, 10)
      if (!Number.isFinite(refNum)) {
        setError('El Ref debe ser un número (alumno_ref).')
        return
      }

      const { data, error: err } = await insforge.database.rpc(
        'usa_lookup_alumno_por_ref',
        { p_ref: refNum },
      )

      if (err) {
        setError(err.message ?? 'Error al buscar alumno_ref')
        return
      }

      const rows = (data ?? []) as AlumnoLookup[]
      const hit = Array.isArray(rows) ? rows[0] : null
      if (!hit) {
        setError(`No se encontró alumno con ref "${raw}"`)
        return
      }

      setError(null)
      const { alumnoId, alumnoRef: ref, patch } = lookupToLink(hit)
      setAlumnos((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, ...patch, alumnoId, alumnoRef: String(ref) } : a,
        ),
      )
      const { error: upErr } = await insforge.database
        .from(TABLE)
        .update({
          alumno_id: alumnoId,
          alumno_ref: ref,
        })
        .eq('id', id)
      if (upErr) {
        setError(upErr.message ?? 'Error al enlazar alumno')
        await refresh()
        return
      }
      await refresh()
    },
    [refresh, updateAlumno],
  )

  const syncFromPagos = useCallback(async () => {
    if (!isInsforgeConfigured) {
      setError('InsForge no configurado (INSFORGE_URL / INSFORGE_ANON_KEY).')
      return null
    }
    setSyncing(true)
    const beforeIds = new Set(
      alumnos.filter((a) => !isAlumnoPrueba(a.id)).map((a) => a.id),
    )
    const beforePago1 = new Map(
      alumnos
        .filter((a) => !isAlumnoPrueba(a.id))
        .map((a) => [a.id, Boolean(a.fechaPago1?.trim())] as const),
    )
    const { data, error: err } = await insforge.database.rpc(
      'usa_sync_pagos_programa',
      { p_ciclo: CICLO_NUMERO },
    )
    if (err) {
      setError(err.message ?? 'Error al sincronizar pagos del programa')
      setSyncing(false)
      return null
    }
    const rows = (data ?? []) as Omit<
      SyncPagosResult,
      'nuevos' | 'pagosNuevos'
    >[]
    const result = Array.isArray(rows)
      ? rows[0]
      : (data as Omit<SyncPagosResult, 'nuevos' | 'pagosNuevos'>)

    const { data: listData, error: listErr } = await insforge.database.rpc(
      'usa_programa_list',
    )
    if (listErr) {
      setError(listErr.message ?? 'Error al recargar tras sincronizar')
      setSyncing(false)
      return null
    }
    const list = ((listData ?? []) as AlumnoRow[]).map(rowToAlumno)
    setAlumnos((prev) => mergeConPruebas(list, prev))
    setError(null)
    setSyncing(false)
    const nuevos = list.filter((a) => !beforeIds.has(a.id))
    const pagosNuevos = list.filter((a) => {
      if (!a.fechaPago1?.trim()) return false
      const teniaPago = beforePago1.get(a.id) === true
      return !teniaPago
    })
    return {
      inserted: result?.inserted ?? 0,
      updated: result?.updated ?? 0,
      alumnos: result?.alumnos ?? list.length,
      nuevos,
      pagosNuevos,
    }
  }, [alumnos])

  const resetSeed = useCallback(() => {
    void (async () => {
      setLoading(true)
      const { error: delErr } = await insforge.database
        .from(TABLE)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
      if (delErr) {
        setError(delErr.message ?? 'Error al limpiar')
        setLoading(false)
        return
      }
      setError(null)
      await refresh()
    })()
  }, [refresh])

  const value = useMemo(
    () => ({
      alumnos,
      loading,
      syncing,
      error,
      clearError,
      updateAlumno,
      applyAlumnoRef,
      syncFromPagos,
      resetSeed,
      addAlumnoPrueba,
    }),
    [
      alumnos,
      loading,
      syncing,
      error,
      clearError,
      updateAlumno,
      applyAlumnoRef,
      syncFromPagos,
      resetSeed,
      addAlumnoPrueba,
    ],
  )

  return (
    <AlumnosContext.Provider value={value}>{children}</AlumnosContext.Provider>
  )
}

export function useAlumnos() {
  const ctx = useContext(AlumnosContext)
  if (!ctx) throw new Error('useAlumnos debe usarse dentro de AlumnosProvider')
  return ctx
}
