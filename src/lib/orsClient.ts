import type { RouteResult } from '../types'

const ORS_DIRECTIONS_URL = '/api/directions'

/** Erreur "affichable telle quelle" : message déjà en français, prêt pour l'UI. */
export class OrsError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'OrsError'
    this.status = status
  }
}

export interface GenerateRouteParams {
  apiKey?: string
  homeLat: number
  homeLng: number
  /** Distance de la boucle visée, en mètres. */
  distanceMeters: number
  /** Nombre de points de la boucle (4 à 6). */
  points?: number
  /** Change le tracé sans changer la distance visée (bouton "Régénérer"). */
  seed?: number
  /** Génère plusieurs tracés à distance égale et garde le plus plat. */
  avoidHills?: boolean
}

// ORS approxime la longueur demandée, mais peut largement la dépasser
// (retours terrain jusqu'à 2x+, surtout avec peu de points ou peu de rues
// à proximité). On retente en corrigeant la longueur demandée
// proportionnellement à l'écart observé, jusqu'à tomber dans la tolérance
// ou épuiser les tentatives — et on garde la meilleure au final.
const MAX_DISTANCE_ATTEMPTS = 3
const TOLERANCE = 0.15

// ORS n'a pas de paramètre "éviter les côtes" pour le profil piéton
// (contrairement au vélo). Seul levier réaliste : générer d'autres tracés à
// la même distance (seed différent) et garder celui qui monte le moins.
// C'est une préférence, pas une garantie.
const EXTRA_FLAT_CANDIDATES = 2

/**
 * Génère une boucle piétonne réelle (vraies rues) autour du domicile via
 * l'API openrouteservice `directions`, profil foot-walking, option round_trip.
 * Doc : https://openrouteservice.org/dev/#/api-docs/v2/directions
 */
export async function generateRoundTripRoute(
  params: GenerateRouteParams,
): Promise<RouteResult> {
  const target = params.distanceMeters
  let requestLength = target
  let best: RouteResult | null = null
  let bestDiff = Infinity

  for (let attempt = 0; attempt < MAX_DISTANCE_ATTEMPTS; attempt++) {
    const result = await requestRoundTrip({ ...params, distanceMeters: requestLength })

    const diff = Math.abs(result.distanceMeters - target)
    if (diff < bestDiff) {
      best = result
      bestDiff = diff
    }

    const ratio = result.distanceMeters / target
    const withinTolerance = ratio >= 1 - TOLERANCE && ratio <= 1 + TOLERANCE
    if (withinTolerance || attempt === MAX_DISTANCE_ATTEMPTS - 1) break

    // Ex : demandé 7000m, obtenu 16000m (ratio 2.28) -> on redemande ~3070m
    // pour la tentative suivante.
    requestLength = requestLength / ratio
  }

  if (params.avoidHills && best) {
    best = await pickFlattestCandidate(params, requestLength, target, best)
  }

  return best as RouteResult
}

/** Essaie quelques tracés de plus à la même distance visée, garde le plus plat. */
async function pickFlattestCandidate(
  params: GenerateRouteParams,
  requestLength: number,
  target: number,
  baseline: RouteResult,
): Promise<RouteResult> {
  let flattest = baseline

  for (let i = 0; i < EXTRA_FLAT_CANDIDATES; i++) {
    try {
      const candidate = await requestRoundTrip({
        ...params,
        distanceMeters: requestLength,
        seed: Date.now() + i + 1, // seed différent : autre forme de boucle, même distance visée
      })

      const ratio = candidate.distanceMeters / target
      const withinTolerance = ratio >= 1 - TOLERANCE && ratio <= 1 + TOLERANCE
      if (withinTolerance && candidate.ascentMeters < flattest.ascentMeters) {
        flattest = candidate
      }
    } catch {
      // Si un candidat échoue, on conserve le meilleur trouvé jusqu'ici
    }
  }

  return flattest
}

async function requestRoundTrip({
  apiKey,
  homeLat,
  homeLng,
  distanceMeters,
  points = 4 + Math.floor(Math.random() * 3),
  seed = Date.now(),
}: GenerateRouteParams): Promise<RouteResult> {
  if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) {
    throw new OrsError(
      "Distance restante nulle : l'objectif est déjà atteint, rien à générer.",
    )
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (apiKey?.trim()) {
    headers['x-ors-api-key'] = apiKey.trim()
  }

  let response: Response
  try {
    response = await fetch(ORS_DIRECTIONS_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        coordinates: [[homeLng, homeLat]],
        elevation: true,
        options: {
          round_trip: {
            length: Math.round(distanceMeters),
            points,
            seed,
          },
        },
      }),
    })
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
    if (response.status === 429) {
      throw new OrsError(
        'Quota openrouteservice dépassé pour aujourd’hui (2 000 req/jour max), réessaie plus tard.',
        response.status,
      )
    }
    const detail = await extractErrorDetail(response)
    throw new OrsError(
      `Erreur génération de trajet (${response.status})${detail ? ` : ${detail}` : ''}`,
      response.status,
    )
  }

  const geojson = await response.json()
  const feature = geojson?.features?.[0]
  // Avec `elevation: true`, chaque point est [lng, lat, altitude].
  const rawCoordinates: number[][] | undefined = feature?.geometry?.coordinates
  const distance: number | undefined = feature?.properties?.summary?.distance
  const duration: number | undefined = feature?.properties?.summary?.duration

  if (!rawCoordinates?.length || distance === undefined) {
    throw new OrsError('Réponse openrouteservice inattendue, aucun tracé trouvé.')
  }

  const elevations = rawCoordinates.map((point) => point[2] ?? 0)
  const { ascent, descent } = computeElevationChange(elevations)

  return {
    // ORS renvoie [lng, lat, alt] (GeoJSON), Leaflet attend [lat, lng].
    coordinates: rawCoordinates.map(([lng, lat]) => [lat, lng]),
    elevations,
    distanceMeters: distance,
    durationSeconds: duration ?? 0,
    ascentMeters: ascent,
    descentMeters: descent,
    seed,
  }
}

/**
 * Dénivelé positif/négatif cumulé (D+/D-) à partir du profil d'altitude.
 */
function computeElevationChange(elevations: number[]): { ascent: number; descent: number } {
  let ascent = 0
  let descent = 0
  for (let i = 1; i < elevations.length; i++) {
    const diff = elevations[i] - elevations[i - 1]
    if (diff > 0) ascent += diff
    else descent += Math.abs(diff)
  }
  return { ascent: Math.round(ascent), descent: Math.round(descent) }
}

async function extractErrorDetail(response: Response): Promise<string | null> {
  try {
    const data = await response.json()
    return (
      data?.error?.message ??
      data?.error?.detail ??
      data?.message ??
      (typeof data?.error === 'string' ? data.error : null)
    )
  } catch {
    return null
  }
}
