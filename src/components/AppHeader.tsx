import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCircleInfo,
  faMoon,
  faSun,
} from '@fortawesome/free-solid-svg-icons'
import { CICLO_ESCOLAR, CUOTA_ANUAL_USD, formatUsd } from '../lib/constants'
import { useTheme } from '../hooks/useTheme'

type Props = {
  onHelp: () => void
}

export function AppHeader({ onHelp }: Props) {
  const { isDark, toggleTheme } = useTheme()

  return (
    <header className="border-b border-brand/20 bg-brand text-on-brand">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div>
          <h1 className="font-display text-[1.65rem] leading-tight font-bold tracking-tight sm:text-[1.85rem]">
            PROGRAMA WINSTON–HÖKKU ACADEMY
          </h1>
          <p className="mt-1 text-sm font-semibold tracking-[0.18em] text-on-brand-muted uppercase">
            Ciclo escolar {CICLO_ESCOLAR}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <p className="rounded-full bg-white/10 px-4 py-2.5 text-sm">
            Cuota anual por alumno:{' '}
            <span className="font-semibold">{formatUsd(CUOTA_ANUAL_USD)}</span>
          </p>
          <button
            type="button"
            onClick={onHelp}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/20"
            aria-label="Ayuda e instrucciones"
          >
            Ayuda
            <FontAwesomeIcon icon={faCircleInfo} className="text-lg" />
          </button>
          {/* Interruptor discreto: solo icono, al lado de Ayuda */}
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex size-10 items-center justify-center rounded-full text-on-brand/70 hover:bg-white/10 hover:text-on-brand"
            aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={isDark ? 'Modo claro' : 'Modo oscuro'}
          >
            <FontAwesomeIcon icon={isDark ? faSun : faMoon} className="text-base" />
          </button>
        </div>
      </div>
    </header>
  )
}
