import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type ToastTone = 'info' | 'success' | 'error'

export type ToastItem = {
  id: string
  message: string
  tone: ToastTone
}

type ToastValue = {
  toasts: ToastItem[]
  pushToast: (message: string, tone?: ToastTone) => void
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastValue | null>(null)

const AUTO_DISMISS_MS = 4200

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const pushToast = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      const id = crypto.randomUUID()
      setToasts((prev) => [...prev, { id, message, tone }])
      window.setTimeout(() => dismissToast(id), AUTO_DISMISS_MS)
    },
    [dismissToast],
  )

  const value = useMemo(
    () => ({ toasts, pushToast, dismissToast }),
    [toasts, pushToast, dismissToast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-3 sm:bottom-6 sm:items-end sm:px-5"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <button
            key={toast.id}
            type="button"
            onClick={() => dismissToast(toast.id)}
            className={`pointer-events-auto max-w-md rounded-lg border px-4 py-3 text-left text-sm shadow-lg transition ${
              toast.tone === 'error'
                ? 'border-baja-border bg-baja text-baja-text'
                : toast.tone === 'success'
                  ? 'border-chip-activos/40 bg-cell text-chip-activos'
                  : 'border-brand-border bg-cell text-ink'
            }`}
          >
            {toast.message}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider')
  return ctx
}
