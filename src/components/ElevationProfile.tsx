import { useId, useMemo, useState } from 'react'
import { MountainIcon } from './icons'
import './ElevationProfile.css'

interface ElevationProfileProps {
  elevations: number[]
  distanceMeters: number
  ascentMeters: number
  descentMeters: number
  onHoverPoint?: (index: number | null) => void
}

interface PointData {
  x: number
  y: number
  ele: number
  slope: number // en pourcentage (ex: 6.5 pour 6.5%)
  color: string
  index: number
}

function getSlopeColor(slope: number): string {
  if (slope >= 9) return '#ff3838' // Rouge vif (très raide)
  if (slope >= 6) return '#ff6b4a' // Rouge-orangé (raide)
  if (slope >= 3.5) return '#ffb338' // Orange/Ambre (modéré)
  return '#7df56c' // Vert lime (plat / faux plat / descente)
}

function getSlopeLabel(slope: number): { text: string; prefix: string; color: string } {
  const color = getSlopeColor(slope)
  if (slope >= 9) return { text: 'Très raide', prefix: '↗', color }
  if (slope >= 6) return { text: 'Montée raide', prefix: '↗', color }
  if (slope >= 3.5) return { text: 'Montée', prefix: '↗', color }
  if (slope <= -4) return { text: 'Descente', prefix: '↘', color: '#58c48c' }
  return { text: 'Plat', prefix: '→', color: '#7df56c' }
}

export default function ElevationProfile({
  elevations,
  distanceMeters,
  ascentMeters,
  descentMeters,
  onHoverPoint,
}: ElevationProfileProps) {
  const strokeGradientId = useId()
  const areaGradientId = useId()
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const { minEle, maxEle, maxSlope, points, pathData, areaData, gradientStops } = useMemo(() => {
    if (!elevations || elevations.length === 0) {
      return {
        minEle: 0,
        maxEle: 0,
        maxSlope: 0,
        points: [],
        pathData: '',
        areaData: '',
        gradientStops: [],
      }
    }

    const min = Math.min(...elevations)
    const max = Math.max(...elevations)
    const padding = Math.max((max - min) * 0.18, 6)
    const yMin = min - padding
    const yMax = max + padding
    const range = yMax - yMin || 1

    const width = 320
    const height = 90
    const totalPts = elevations.length
    const distStepMeters = distanceMeters / (totalPts - 1 || 1)

    // Calcul de pente lissée avec fenêtre mobile pour éviter le bruit DEM
    const slopes = elevations.map((_, i) => {
      const windowSize = Math.max(1, Math.min(3, Math.floor(totalPts / 15)))
      const iStart = Math.max(0, i - windowSize)
      const iEnd = Math.min(totalPts - 1, i + windowSize)
      const deltaH = elevations[iEnd] - elevations[iStart]
      const deltaD = (iEnd - iStart) * distStepMeters
      if (deltaD <= 0) return 0
      return (deltaH / deltaD) * 100
    })

    const computedMaxSlope = Math.max(0, ...slopes)

    const pts: PointData[] = elevations.map((ele, i) => {
      const x = (i / (totalPts - 1 || 1)) * width
      const y = height - ((ele - yMin) / range) * (height - 14) - 7
      const slope = slopes[i]
      const color = getSlopeColor(slope)
      return { x, y, ele, slope, color, index: i }
    })

    const pData = pts.reduce((acc, pt, i) => {
      return i === 0
        ? `M ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`
        : `${acc} L ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`
    }, '')

    const aData = `${pData} L ${width},${height} L 0,${height} Z`

    // Dégradé horizontal dynamique multi-couleurs selon la pente
    // Sous-échantillonnage des stops pour un rendu SVG optimal
    const sampleRate = Math.max(1, Math.floor(totalPts / 35))
    const stops = pts
      .filter((_, idx) => idx % sampleRate === 0 || idx === totalPts - 1)
      .map((pt) => {
        const offsetPercent = ((pt.index / (totalPts - 1 || 1)) * 100).toFixed(1)
        return {
          offset: `${offsetPercent}%`,
          color: pt.color,
        }
      })

    return {
      minEle: Math.round(min),
      maxEle: Math.round(max),
      maxSlope: Number(computedMaxSlope.toFixed(1)),
      points: pts,
      pathData: pData,
      areaData: aData,
      gradientStops: stops,
    }
  }, [elevations, distanceMeters])

  if (!elevations || elevations.length < 2) return null

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const relativeX = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const ratio = relativeX / rect.width
    const index = Math.min(
      Math.round(ratio * (elevations.length - 1)),
      elevations.length - 1,
    )
    setHoverIndex(index)
    onHoverPoint?.(index)
  }

  const handlePointerLeave = () => {
    setHoverIndex(null)
    onHoverPoint?.(null)
  }

  const activePoint = hoverIndex !== null ? points[hoverIndex] : null
  const activeDistanceKm =
    hoverIndex !== null
      ? ((hoverIndex / (elevations.length - 1)) * (distanceMeters / 1000)).toFixed(2)
      : null

  const slopeInfo = activePoint ? getSlopeLabel(activePoint.slope) : null

  return (
    <div className="elevation-profile">
      <div className="elevation-profile__header">
        <div className="elevation-profile__title">
          <MountainIcon />
          <span>Profil altimétrique</span>
        </div>
        <div className="elevation-profile__stats">
          <span>
            Min : <strong>{minEle}m</strong>
          </span>
          <span>
            Max : <strong>{maxEle}m</strong>
          </span>
          <span>
            D+ : <strong>+{Math.round(ascentMeters)}m</strong>
          </span>
          <span>
            D- : <strong>-{Math.round(descentMeters)}m</strong>
          </span>
          <span
            className={`elevation-profile__max-slope ${maxSlope >= 7 ? 'elevation-profile__max-slope--steep' : ''}`}
          >
            Pente max : <strong>{maxSlope}%</strong>
          </span>
        </div>
      </div>

      <div className="elevation-profile__chart">
        <svg
          viewBox="0 0 320 90"
          preserveAspectRatio="none"
          className="elevation-profile__svg"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          <defs>
            {/* Dégradé horizontal coloré pour le tracé */}
            <linearGradient id={strokeGradientId} x1="0" y1="0" x2="1" y2="0">
              {gradientStops.map((stop, i) => (
                <stop key={i} offset={stop.offset} stopColor={stop.color} />
              ))}
            </linearGradient>

            {/* Dégradé vertical pour la zone de remplissage */}
            <linearGradient id={areaGradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Remplissage de la surface */}
          <path d={areaData} fill={`url(#${areaGradientId})`} />

          {/* Tracé altimétrique avec coloration dynamique selon la pente */}
          <path
            d={pathData}
            fill="none"
            stroke={`url(#${strokeGradientId})`}
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Curseur interactif au survol */}
          {activePoint && (
            <>
              <line
                x1={activePoint.x}
                y1={0}
                x2={activePoint.x}
                y2={90}
                stroke="rgba(255, 255, 255, 0.3)"
                strokeDasharray="2 3"
                strokeWidth="1"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="5"
                fill={activePoint.color}
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="2"
                fill="var(--bg)"
              />
            </>
          )}
        </svg>

        {activePoint && activeDistanceKm && slopeInfo && (
          <div
            className="elevation-profile__tooltip"
            style={{
              left: `${(activePoint.x / 320) * 100}%`,
            }}
          >
            <span className="elevation-tooltip__dist">{activeDistanceKm} km</span>
            <span className="elevation-tooltip__divider">•</span>
            <strong className="elevation-tooltip__alt">{Math.round(activePoint.ele)} m</strong>
            <span className="elevation-tooltip__divider">•</span>
            <span
              className="elevation-tooltip__slope"
              style={{ color: slopeInfo.color }}
            >
              {activePoint.slope > 0 ? `+${activePoint.slope.toFixed(1)}%` : `${activePoint.slope.toFixed(1)}%`}
            </span>
          </div>
        )}
      </div>

      {/* Légende rapide des couleurs de pente */}
      <div className="elevation-profile__legend">
        <span className="legend-item">
          <span className="legend-dot" style={{ background: '#7df56c' }} /> Plat / Faible (&lt; 3.5%)
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: '#ffb338' }} /> Montée (3.5 - 6%)
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: '#ff3838' }} /> Raide (&ge; 6%)
        </span>
      </div>
    </div>
  )
}
