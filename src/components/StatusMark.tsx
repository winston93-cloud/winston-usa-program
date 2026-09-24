import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCheck,
  faExclamation,
  faStamp,
} from '@fortawesome/free-solid-svg-icons'

type Props = {
  done: boolean
  title: string
  /** Pendiente visible (sin color naranja). */
  pending?: boolean
  /** Alerta (devolución). */
  alert?: boolean
  /**
   * mark = cuadrado (pagos), misma altura que tile
   * tile = bloque a ancho de celda
   */
  variant?: 'mark' | 'tile'
  /** Texto en tile solo cuando está listo (p. ej. «Listo»). */
  label?: string
  /** Icono en tile solo cuando está listo. */
  tileIcon?: 'check' | 'stamp'
  /**
   * Color cuando está listo.
   * green = validación; blue/slate = pagos y autorización (menos verde).
   */
  doneTone?: 'green' | 'blue' | 'slate'
  onClick?: () => void
  disabled?: boolean
}

const DONE_TONE: Record<'green' | 'blue' | 'slate', string> = {
  green: 'bg-mark-green text-mark-on',
  blue: 'bg-mark-blue text-mark-on',
  slate: 'bg-mark-gray text-mark-on',
}

/** Cuadrado fijo (igual altura que tile min-h-8). */
const MARK_BOX = 'size-8'

/** Indicador a tamaño de celda. */
export function StatusMark({
  done,
  title,
  pending = false,
  alert = false,
  variant = 'mark',
  label,
  tileIcon,
  doneTone = 'green',
  onClick,
  disabled,
}: Props) {
  if (!done && !alert && !pending) {
    const emptyClass =
      variant === 'tile'
        ? 'block min-h-8 w-full'
        : `block ${MARK_BOX} shrink-0`
    return <span className={emptyClass} title={title} aria-label={title} />
  }

  const tone = alert
    ? 'bg-mark-red text-mark-on'
    : done
      ? DONE_TONE[doneTone]
      : 'bg-mark-pending-bg text-mark-pending-fg'

  const interactive = ` ${
    onClick && !disabled
      ? 'cursor-pointer transition-[filter] duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tone-accent-ring)]'
      : ''
  } ${disabled ? 'opacity-50' : ''}`

  if (variant === 'tile') {
    const className = `flex min-h-8 w-full items-center justify-center rounded-md text-xs font-semibold tracking-wide uppercase ${tone}${interactive}`
    const body = alert ? (
      <FontAwesomeIcon icon={faExclamation} className="text-sm" />
    ) : done && tileIcon === 'stamp' ? (
      <FontAwesomeIcon icon={faStamp} className="text-sm" />
    ) : done && tileIcon === 'check' ? (
      <FontAwesomeIcon icon={faCheck} className="text-sm" />
    ) : done && label ? (
      <span>{label}</span>
    ) : null

    if (onClick) {
      return (
        <button
          type="button"
          title={title}
          aria-label={title}
          disabled={disabled}
          onClick={onClick}
          className={className}
        >
          {body}
        </button>
      )
    }
    return (
      <span title={title} aria-label={title} className={className}>
        {body}
      </span>
    )
  }

  const className = `flex ${MARK_BOX} shrink-0 items-center justify-center rounded-md ${tone}${interactive}`
  const icon = alert ? (
    <FontAwesomeIcon icon={faExclamation} className="text-sm" />
  ) : done ? (
    <FontAwesomeIcon icon={faCheck} className="text-sm" />
  ) : null

  if (onClick) {
    return (
      <button
        type="button"
        title={title}
        aria-label={title}
        disabled={disabled}
        onClick={onClick}
        className={className}
      >
        {icon}
      </button>
    )
  }

  return (
    <span title={title} aria-label={title} className={className}>
      {icon}
    </span>
  )
}
