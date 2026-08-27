import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

/**
 * Leaflet référence ses icônes par défaut via des chemins relatifs qui ne
 * survivent pas au bundling Vite. On les repointe une fois vers les assets
 * importés (donc hashés/servis correctement par Vite).
 */
export function fixLeafletDefaultIcon(): void {
  // @ts-expect-error _getIconUrl existe à l'exécution mais pas dans les types
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
  })
}
