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
    <header className="shrink-0 border-b border-brand/20 bg-brand text-on-brand">
      <div className="mx-auto flex w-full items-start justify-between gap-3 px-3 py-3 sm:items-center sm:gap-4 sm:px-5 sm:py-4">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[1.15rem] leading-tight font-bold tracking-tight sm:text-[1.65rem] lg:text-[1.85rem]">
            PROGRAMA WINSTON–HÖKKU ACADEMY
          </h1>
          <p className="mt-0.5 text-[0.7rem] font-semibold tracking-[0.14em] text-on-brand-muted uppercase sm:mt-1 sm:text-sm sm:tracking-[0.18em]">
            Ciclo escolar {CICLO_ESCOLAR}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <p className="hidden rounded-full bg-white/10 px-3 py-2 text-sm md:inline-block lg:px-4 lg:py-2.5">
            Cuota anual:{' '}
            <span className="font-semibold">{formatUsd(CUOTA_ANUAL_USD)}</span>
          </p>
          <button
            type="button"
            onClick={onHelp}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-2 text-sm font-semibold hover:bg-white/20 sm:px-4 sm:py-2.5"
            aria-label="Ayuda e instrucciones"
          >
            <span className="hidden sm:inline">Ayuda</span>
            <FontAwesomeIcon icon={faCircleInfo} className="text-lg" />
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex size-9 items-center justify-center rounded-full text-on-brand/70 hover:bg-white/10 hover:text-on-brand sm:size-10"
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
