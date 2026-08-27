// Google Maps limite les itinéraires à 9 étapes intermédiaires (limite du
// produit lui-même, pas de notre code : https://support.google.com/maps —
// "Ajouter jusqu'à 9 étapes"). Impossible donc de lui passer les centaines de
// points du tracé ORS : on échantillonne le maximum autorisé pour coller au
// plus près, mais Google recalcule ensuite son propre itinéraire entre ces
// points plutôt que de rejouer le tracé ORS à l'identique rue pour rue.
const MAX_WAYPOINTS = 9

/**
 * Construit l'URL Google Maps Directions (mode piéton) pour la boucle générée,
 * départ et arrivée au domicile. Ouvre l'app Google Maps sur mobile, le site sinon.
 * Doc : https://developers.google.com/maps/documentation/urls/get-started#directions-action
 */
export function buildGoogleMapsWalkingUrl(
  home: { lat: number; lng: number },
  coordinates: [number, number][],
): string {
  const origin = `${home.lat},${home.lng}`
  const params = new URLSearchParams({
    api: '1',
    origin,
    destination: origin, // boucle : retour au point de départ
    travelmode: 'walking',
  })

  let url = `https://www.google.com/maps/dir/?${params.toString()}`
  const waypoints = sampleWaypoints(coordinates, MAX_WAYPOINTS)
  if (waypoints.length) {
    const encoded = waypoints.map(([lat, lng]) => `${lat},${lng}`).join('|')
    url += `&waypoints=${encodeURIComponent(encoded)}`
  }
  return url
}

function sampleWaypoints(
  coordinates: [number, number][],
  max: number,
): [number, number][] {
  if (coordinates.length <= 2) return []
  // Écarte le premier et dernier point : déjà couverts par origin/destination.
  const usable = coordinates.slice(1, -1)
  if (usable.length <= max) return usable

  const step = usable.length / max
  const sampled: [number, number][] = []
  for (let i = 0; i < max; i++) {
    sampled.push(usable[Math.floor(i * step)])
  }
  return sampled
}
