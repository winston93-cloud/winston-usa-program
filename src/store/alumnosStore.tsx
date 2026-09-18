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
  lookupToPatch,
  patchToRow,
  rowToAlumno,
  type AlumnoLookup,
  type AlumnoRow,
} from '../lib/alumnoMapper'
import { CICLO_NUMERO } from '../lib/constants'
import { insforge, isInsforgeConfigured } from '../lib/insforge'
import type { Alumno, AlumnoPatch } from '../types/alumno'

export type SyncPagosResult = {
  inserted: number
  updated: number
  alumnos: number
}

const TABLE = 'usa_programa_alumno'

type StoreValue = {
  alumnos: Alumno[]
  loading: boolean
  syncing: boolean
  error: string | null
  clearError: () => void
  updateAlumno: (id: string, patch: AlumnoPatch) => void
  /** Busca en Winston por alumno_ref y rellena identidad. */
  applyAlumnoRef: (id: string, alumnoRef: string) => Promise<void>
  /** Carga pagadores 23/24/25 del ciclo desde pago_detalle. */
  syncFromPagos: () => Promise<SyncPagosResult | null>
  resetSeed: () => void
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
      setAlumnos([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error: err } = await insforge.database
      .from(TABLE)
      .select()
      .order('folio', { ascending: true })
      .limit(500)

    if (err) {
      setError(err.message ?? 'Error al cargar registros del programa')
      setAlumnos([])
    } else {
      setError(null)
      setAlumnos(((data ?? []) as AlumnoRow[]).map(rowToAlumno))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const clearError = useCallback(() => setError(null), [])

  const updateAlumno = useCallback(
    (id: string, patch: AlumnoPatch) => {
      setAlumnos((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...patch } : a)),
      )
      void (async () => {
        const { error: err } = await insforge.database
          .from(TABLE)
          .update(patchToRow(patch))
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
      const { alumnoId, patch } = lookupToPatch(hit)
      setAlumnos((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...patch } : a)),
      )
      const { error: upErr } = await insforge.database
        .from(TABLE)
        .update({
          ...patchToRow(patch),
          alumno_id: alumnoId,
          alumno_ref: hit.alumno_ref,
        })
        .eq('id', id)
      if (upErr) {
        setError(upErr.message ?? 'Error al guardar datos del alumno')
        await refresh()
      }
    },
    [refresh, updateAlumno],
  )

  const syncFromPagos = useCallback(async () => {
    if (!isInsforgeConfigured) {
      setError('InsForge no configurado (INSFORGE_URL / INSFORGE_ANON_KEY).')
      return null
    }
    setSyncing(true)
    const { data, error: err } = await insforge.database.rpc(
      'usa_sync_pagos_programa',
      { p_ciclo: CICLO_NUMERO },
    )
    if (err) {
      setError(err.message ?? 'Error al sincronizar pagos del programa')
      setSyncing(false)
      return null
    }
    const rows = (data ?? []) as SyncPagosResult[]
    const result = Array.isArray(rows) ? rows[0] : (data as SyncPagosResult)
    setError(null)
    await refresh()
    setSyncing(false)
    return result ?? null
  }, [refresh])

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
