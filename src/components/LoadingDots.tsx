import { useEffect, useState } from 'react'
import './LoadingDots.css'

/**
 * Indicateur pour la génération de trajet (jusqu'à 3 appels ORS d'affilée en
 * cas de correction d'écart, voir lib/orsClient.ts — ça peut prendre
 * quelques secondes). Grille de pixels en vague chevron + libellé en dégradé
 * animé + chrono en direct, pour rassurer sur une opération qui traîne un peu.
 */

// Grille 3x3, vague qui balaie de gauche à droite (voir doc composant).
const CELL_DELAYS = Array.from({ length: 9 }, (_, i) => {
  const row = Math.floor(i / 3)
  const col = i % 3
  return (col + Math.abs(row - 1)) * 90
})

function useElapsed(): string {
  const [tenths, setTenths] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTenths((t) => t + 1), 100)
    return () => clearInterval(timer)
  }, [])
  const totalSeconds = tenths / 10
  if (totalSeconds < 60) return `${totalSeconds.toFixed(1)}s`
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = (totalSeconds % 60).toFixed(1)
  return `${minutes}m ${seconds}s`
}

interface LoadingDotsProps {
  label?: string
}

export default function LoadingDots({ label = 'Génération du trajet' }: LoadingDotsProps) {
  const elapsed = useElapsed()

  return (
    <div className="loading-dots">
      <span className="loading-dots__grid" aria-hidden="true">
        {CELL_DELAYS.map((delay, i) => (
          <span
            key={i}
            className="loading-dots__cell"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </span>
      <span className="loading-dots__label">{label}</span>
      <span className="loading-dots__timer">{elapsed}</span>
    </div>
  )
}
