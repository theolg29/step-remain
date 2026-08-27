import { OrsError } from './orsClient'

const ORS_GEOCODE_URL = 'https://api.openrouteservice.org/geocode/search'

export interface AddressResult {
  label: string
  lat: number
  lng: number
}

/**
 * Recherche d'adresse via l'API Geocoding d'openrouteservice (Pelias) —
 * même clé API que le reste de l'app, pas de service tiers en plus.
 * Doc : https://openrouteservice.org/dev/#/api-docs/geocode/search
 */
export async function searchAddress(apiKey: string, query: string): Promise<AddressResult[]> {
  if (!apiKey) {
    throw new OrsError(
      "Clé API openrouteservice manquante. Renseigne-la dans les paramètres.",
    )
  }
  const trimmed = query.trim()
  if (!trimmed) return []

  const url = `${ORS_GEOCODE_URL}?${new URLSearchParams({
    api_key: apiKey,
    text: trimmed,
    size: '5',
  })}`

  let response: Response
  try {
    response = await fetch(url)
  } catch {
    throw new OrsError(
      'Impossible de contacter openrouteservice. Vérifie ta connexion internet.',
    )
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new OrsError(
        'Clé API openrouteservice invalide ou non autorisée. Vérifie-la dans les paramètres.',
        response.status,
      )
    }
    throw new OrsError(`Erreur de recherche d'adresse (${response.status}).`, response.status)
  }

  const geojson = await response.json()
  const features: unknown[] = geojson?.features ?? []

  return features
    .map((feature) => {
      const f = feature as {
        geometry?: { coordinates?: [number, number] }
        properties?: { label?: string }
      }
      const coordinates = f.geometry?.coordinates
      const label = f.properties?.label
      if (!coordinates || !label) return null
      const [lng, lat] = coordinates
      return { label, lat, lng }
    })
    .filter((result): result is AddressResult => result !== null)
}
