import { useEffect, useState } from 'react'
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet'
import { formatDuration } from '../lib/formatDuration'
import { buildGoogleMapsWalkingUrl } from '../lib/googleMaps'
import { buildGpx, shareOrDownloadGpx } from '../lib/gpx'
import { fixLeafletDefaultIcon } from '../lib/leafletIcons'
import { metersToSteps } from '../lib/stepLength'
import type { RouteResult } from '../types'
import { NavigationIcon, RefreshIcon, ShareIcon } from './icons'
import './RouteMap.css'

fixLeafletDefaultIcon()

interface RouteMapProps {
  home: { lat: number; lng: number }
  heightCm: number
  route: RouteResult | null
  isGenerating: boolean
  error: string | null
  onRegenerate: () => void
}

function FitToRoute({ coordinates }: { coordinates: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (coordinates.length > 1) {
      map.fitBounds(coordinates, { padding: [24, 24] })
    }
  }, [coordinates, map])
  return null
}

export default function RouteMap({
  home,
  heightCm,
  route,
  isGenerating,
  error,
  onRegenerate,
}: RouteMapProps) {
  const [isSharingGpx, setIsSharingGpx] = useState(false)
  const realSteps = route ? metersToSteps(route.distanceMeters, heightCm) : 0
  const googleMapsUrl = route ? buildGoogleMapsWalkingUrl(home, route.coordinates) : null

  const handleShareGpx = async () => {
    if (!route) return
    setIsSharingGpx(true)
    try {
      const km = (route.distanceMeters / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })
      const date = new Date().toISOString().slice(0, 10)
      const gpx = buildGpx(route, `Trajet pas restants – ${km} km`)
      await shareOrDownloadGpx(gpx, `pas-restants-${date}.gpx`)
    } finally {
      setIsSharingGpx(false)
    }
  }

  return (
    <section className="route-card">
      <div className="route-card__map">
        <MapContainer center={[home.lat, home.lng]} zoom={15} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[home.lat, home.lng]} />
          {route && (
            <>
              <Polyline
                positions={route.coordinates}
                pathOptions={{ color: 'var(--primary)', weight: 4 }}
              />
              <FitToRoute coordinates={route.coordinates} />
            </>
          )}
        </MapContainer>
        {route && (
          <button
            type="button"
            className={`icon-button route-card__regenerate ${isGenerating ? 'icon-button--spin' : ''}`}
            onClick={onRegenerate}
            disabled={isGenerating}
            aria-label="Régénérer le trajet"
            title="Régénérer le trajet"
          >
            <RefreshIcon />
          </button>
        )}
      </div>

      {error && <p className="route-card__error">{error}</p>}

      {route && !error && (
        <>
          <div className="route-card__stats">
            <div className="stat">
              <strong>
                {(route.distanceMeters / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} km
              </strong>
              <span>distance réelle</span>
            </div>
            <div className="stat">
              <strong>{realSteps.toLocaleString('fr-FR')}</strong>
              <span>pas correspondants</span>
            </div>
            <div className="stat">
              <strong>{formatDuration(route.durationSeconds)}</strong>
              <span>temps estimé</span>
            </div>
            <div className="stat">
              <strong>
                +{Math.round(route.ascentMeters)} m / -{Math.round(route.descentMeters)} m
              </strong>
              <span>dénivelé D+ / D-</span>
            </div>
          </div>

          <div className="route-card__actions">
            <a
              className="btn btn--primary btn--pill"
              href={googleMapsUrl ?? undefined}
              target="_blank"
              rel="noreferrer"
            >
              <NavigationIcon />
              Démarrer
            </a>
            <button
              type="button"
              className="icon-button icon-button--lg"
              onClick={handleShareGpx}
              disabled={isSharingGpx}
              aria-label="Exporter le trajet en GPX (tous les points, pour OsmAnd, Komoot...)"
              title="Exporter en GPX"
            >
              <ShareIcon />
            </button>
          </div>
          <p className="route-card__gpx-hint">
            "Démarrer" guide sur Google Maps (approximatif, 9 étapes max). Pour
            suivre le tracé exact, exporte-le en GPX et importe-le dans OsmAnd,
            Komoot ou une app équivalente.
          </p>
        </>
      )}
    </section>
  )
}
