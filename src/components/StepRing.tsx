import type { ReactNode } from 'react'
import './StepRing.css'

const SIZE = 216
const STROKE = 16
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

interface StepRingProps {
  /** Fraction de l'objectif atteint, 0 à 1 (le trait se remplit à mesure qu'on avance). */
  progress: number
  value: ReactNode
  label: string
}

export default function StepRing({ progress, value, label }: StepRingProps) {
  const clamped = Math.min(Math.max(progress, 0), 1)
  const offset = CIRCUMFERENCE * (1 - clamped)

  return (
    <div className="step-ring" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <defs>
          <linearGradient id="stepRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--primary-2)" />
          </linearGradient>
        </defs>
        <circle
          className="step-ring__track"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE}
          fill="none"
        />
        <circle
          className="step-ring__progress"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </svg>
      <div className="step-ring__center">
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  )
}
