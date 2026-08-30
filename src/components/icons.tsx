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

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg width={20} height={20} {...strokeBase} {...props}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg width={20} height={20} {...strokeBase} {...props}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

export function FootprintsIcon(props: IconProps) {
  return (
    <svg width={24} height={24} {...strokeBase} {...props}>
      <path d="M4 16v-2.38C4 11.5 5.5 9 8 9s4 2.5 4 4.62V16c0 1.5-1.5 3-4 3s-4-1.5-4-3z" />
      <path d="M12 7.5v-2C12 3.5 13.5 1 16 1s4 2.5 4 4.5V7.5c0 1.5-1.5 3-4 3s-4-1.5-4-3z" />
      <circle cx="8" cy="5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="16" cy="14" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function SparklesIcon(props: IconProps) {
  return (
    <svg width={20} height={20} {...strokeBase} {...props}>
      <path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4z" />
    </svg>
  )
}

export function RouteIcon(props: IconProps) {
  return (
    <svg width={20} height={20} {...strokeBase} {...props}>
      <circle cx="6" cy="19" r="3" />
      <path d="M9 19h8.5a4.5 4.5 0 0 0 0-9H7a3 3 0 0 1 0-6h10" />
      <circle cx="18" cy="4" r="2" fill="currentColor" />
    </svg>
  )
}

export function TargetGoalIcon(props: IconProps) {
  return (
    <svg width={20} height={20} {...strokeBase} {...props}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  )
}

export function ShieldCheckIcon(props: IconProps) {
  return (
    <svg width={20} height={20} {...strokeBase} {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  )
}

export function HeartIcon(props: IconProps) {
  return (
    <svg width={18} height={18} {...strokeBase} {...props}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  )
}

export function HeartFilledIcon(props: IconProps) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="var(--danger)" stroke="var(--danger)" strokeWidth={1.8} {...props}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  )
}

export function BookmarkIcon(props: IconProps) {
  return (
    <svg width={18} height={18} {...strokeBase} {...props}>
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  )
}

export function HistoryIcon(props: IconProps) {
  return (
    <svg width={20} height={20} {...strokeBase} {...props}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l3 3" />
    </svg>
  )
}

export function TrashIcon(props: IconProps) {
  return (
    <svg width={16} height={16} {...strokeBase} {...props}>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  )
}

export function MountainIcon(props: IconProps) {
  return (
    <svg width={18} height={18} {...strokeBase} {...props}>
      <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
    </svg>
  )
}

export function ZapIcon(props: IconProps) {
  return (
    <svg width={16} height={16} {...strokeBase} {...props}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

export function CompassIcon(props: IconProps) {
  return (
    <svg width={16} height={16} {...strokeBase} {...props}>
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" />
    </svg>
  )
}

export function TreeIcon(props: IconProps) {
  return (
    <svg width={16} height={16} {...strokeBase} {...props}>
      <path d="M12 22v-4" />
      <path d="M12 18a8 8 0 0 1-8-8c0-4.4 3.6-8 8-8s8 3.6 8 8a8 8 0 0 1-8 8z" />
    </svg>
  )
}

