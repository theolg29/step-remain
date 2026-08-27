import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const strokeBase = {
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

/** Réglages : trois curseurs, plus lisible qu'un engrenage à cette taille. */
export function SlidersIcon(props: IconProps) {
  return (
    <svg width={20} height={20} {...strokeBase} {...props}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <circle cx="15" cy="6" r="2" fill="currentColor" stroke="none" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <circle cx="9" cy="12" r="2" fill="currentColor" stroke="none" />
      <line x1="4" y1="18" x2="20" y2="18" />
      <circle cx="16" cy="18" r="2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function SearchIcon(props: IconProps) {
  return (
    <svg width={18} height={18} {...strokeBase} {...props}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.2" y2="16.2" />
    </svg>
  )
}

/** Marker de position (domicile). */
export function PinIcon(props: IconProps) {
  return (
    <svg width={18} height={18} {...strokeBase} {...props}>
      <path d="M12 21s-7-7.75-7-12a7 7 0 1 1 14 0c0 4.25-7 12-7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  )
}

export function RefreshIcon(props: IconProps) {
  return (
    <svg width={18} height={18} {...strokeBase} {...props}>
      <path d="M3.5 12a8.5 8.5 0 0 1 14.6-5.9" />
      <path d="M20.5 12a8.5 8.5 0 0 1-14.6 5.9" />
      <path d="M18.1 3.5v3.4h-3.4" />
      <path d="M5.9 20.5v-3.4h3.4" />
    </svg>
  )
}

/** Partage/export (bouton "Exporter GPX"). */
export function ShareIcon(props: IconProps) {
  return (
    <svg width={18} height={18} {...strokeBase} {...props}>
      <path d="M12 15V3" />
      <path d="M8 7l4-4 4 4" />
      <path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
    </svg>
  )
}

/** Flèche de navigation (bouton "Démarrer" -> Google Maps). */
export function NavigationIcon(props: IconProps) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2.5 20 20l-8-4-8 4 8-17.5z" />
    </svg>
  )
}

export function EyeIcon(props: IconProps) {
  return (
    <svg width={18} height={18} {...strokeBase} {...props}>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function EyeOffIcon(props: IconProps) {
  return (
    <svg width={18} height={18} {...strokeBase} {...props}>
      <path d="M3.5 3.5l17 17" />
      <path d="M10.6 5.2c.45-.13.9-.2 1.4-.2 6.4 0 10 7 10 7a15.7 15.7 0 0 1-3.4 4.3" />
      <path d="M6.7 6.7C4.1 8.3 2 12 2 12s3.6 7 10 7c1.4 0 2.7-.3 3.8-.8" />
      <path d="M9.5 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  )
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg width={16} height={16} {...strokeBase} {...props}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <svg width={32} height={32} {...strokeBase} strokeWidth={2.4} {...props}>
      <polyline points="4 13 9.5 18.5 20 6" />
    </svg>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <svg width={18} height={18} {...strokeBase} {...props}>
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  )
}
