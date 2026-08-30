import { formatDuration } from '../lib/formatDuration'
import { buildGoogleMapsWalkingUrl } from '../lib/googleMaps'
import { buildGpx, shareOrDownloadGpx } from '../lib/gpx'
import { metersToSteps } from '../lib/stepLength'
import type { RouteResult, SavedRoute } from '../types'
import {
  CloseIcon,
  HeartFilledIcon,
  HeartIcon,
  NavigationIcon,
  RouteIcon,
  ShareIcon,
  TrashIcon,
} from './icons'
import './SavedRoutesModal.css'

interface SavedRoutesModalProps {
  isOpen: boolean
  onClose: () => void
  savedRoutes: SavedRoute[]
  onSelectRoute: (route: RouteResult) => void
  onToggleFavorite: (id: string) => void
  onRemoveRoute: (id: string) => void
  home: { lat: number; lng: number } | null
  heightCm: number
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}



export default function SavedRoutesModal({
  isOpen,
  onClose,
  savedRoutes,
  onSelectRoute,
  onToggleFavorite,
  onRemoveRoute,
  home,
  heightCm,
}: SavedRoutesModalProps) {
  if (!isOpen) return null

  const handleExportGpx = async (saved: SavedRoute) => {
    const km = (saved.route.distanceMeters / 1000).toLocaleString('fr-FR', {
      maximumFractionDigits: 2,
    })
    const gpx = buildGpx(saved.route, saved.name || `Trajet ${km} km`)
    await shareOrDownloadGpx(gpx, `parcours-${saved.id}.gpx`)
  }

  // Sort favorites first, then by date descending
  const sorted = [...savedRoutes].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1
    if (!a.isFavorite && b.isFavorite) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <div className="saved-routes-sheet">
      <div className="saved-routes-sheet__handle-bar">
        <div className="saved-routes-sheet__handle" />
      </div>

      <header className="saved-routes-sheet__header">
        <div className="saved-routes-sheet__title-group">
          <h1>Mes parcours</h1>
          <span className="saved-routes-sheet__count">
            {savedRoutes.length} boucle{savedRoutes.length > 1 ? 's' : ''}
          </span>
        </div>
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label="Fermer mes parcours"
        >
          <CloseIcon />
        </button>
      </header>

      <div className="saved-routes-sheet__body">
        {sorted.length === 0 ? (
          <div className="saved-routes-empty">
            <div className="saved-routes-empty__icon">
              <RouteIcon />
            </div>
            <h3>Aucun parcours enregistré</h3>
            <p>
              Après avoir généré une boucle piétonne, clique sur l'icône cœur pour la retrouver ici et la réutiliser à tout moment !
            </p>
          </div>
        ) : (
          <ul className="saved-routes-list">
            {sorted.map((item) => {
              const km = (item.route.distanceMeters / 1000).toLocaleString('fr-FR', {
                maximumFractionDigits: 2,
              })
              const steps = metersToSteps(item.route.distanceMeters, heightCm)
              const gmapsUrl = home
                ? buildGoogleMapsWalkingUrl(home, item.route.coordinates)
                : null

              return (
                <li key={item.id} className="saved-route-card">
                  <div className="saved-route-card__top">
                    <div className="saved-route-card__info">
                      <div className="saved-route-card__title-row">
                        <strong>{item.name}</strong>
                      </div>
                      <span className="saved-route-card__date">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="icon-button saved-route-card__fav-btn"
                      onClick={() => onToggleFavorite(item.id)}
                      aria-label={
                        item.isFavorite
                          ? 'Retirer des favoris'
                          : 'Ajouter aux favoris'
                      }
                    >
                      {item.isFavorite ? <HeartFilledIcon /> : <HeartIcon />}
                    </button>
                  </div>

                  <div className="saved-route-card__stats">
                    <span>
                      📏 <strong>{km} km</strong>
                    </span>
                    <span>
                      👣 <strong>{steps.toLocaleString('fr-FR')} pas</strong>
                    </span>
                    <span>
                      ⏱️ <strong>{formatDuration(item.route.durationSeconds)}</strong>
                    </span>
                    <span>
                      ⛰️ <strong>+{Math.round(item.route.ascentMeters)}m</strong>
                    </span>
                  </div>

                  <div className="saved-route-card__actions">
                    <button
                      type="button"
                      className="btn btn--primary saved-route-card__load-btn"
                      onClick={() => {
                        onSelectRoute(item.route)
                        onClose()
                      }}
                    >
                      Afficher sur la carte
                    </button>

                    {gmapsUrl && (
                      <a
                        className="icon-button"
                        href={gmapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Démarrer dans Google Maps"
                        aria-label="Démarrer dans Google Maps"
                      >
                        <NavigationIcon />
                      </a>
                    )}

                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => handleExportGpx(item)}
                      title="Exporter GPX"
                      aria-label="Exporter GPX"
                    >
                      <ShareIcon />
                    </button>

                    <button
                      type="button"
                      className="icon-button saved-route-card__del-btn"
                      onClick={() => onRemoveRoute(item.id)}
                      title="Supprimer"
                      aria-label="Supprimer ce parcours"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
