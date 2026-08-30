import { OrsError } from './orsClient'

const ORS_GEOCODE_URL = '/api/geocode'

export interface AddressResult {
  label: string
  lat: number
  lng: number
}

/**
 * Recherche d'adresse via le proxy `/api/geocode` (openrouteservice Pelias) —
 * même clé API que le reste de l'app.
 */
export async function searchAddress(apiKey: string | undefined, query: string): Promise<AddressResult[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  const url = `${ORS_GEOCODE_URL}?${new URLSearchParams({
    text: trimmed,
    size: '5',
  })}`

  const headers: Record<string, string> = {}
  if (apiKey?.trim()) {
    headers['x-ors-api-key'] = apiKey.trim()
  }

  let response: Response
  try {
    response = await fetch(url, { headers })
  } catch {
    throw new OrsError(
      'Impossible de contacter openrouteservice. Vérifie ta connexion internet.',
    )
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new OrsError(
        'Clé API openrouteservice invalide ou non autorisée. Vérifie ta variable ORS_API_KEY sur Vercel.',
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
