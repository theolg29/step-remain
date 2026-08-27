export interface Settings {
  /** Taille de l'utilisateur en cm, sert à calculer la longueur de pas. */
  heightCm: number
  /** Position du domicile, point de départ/arrivée de la boucle. */
  homeLat: number | null
  homeLng: number | null
  /** Clé API openrouteservice, saisie par l'utilisateur, jamais en dur dans le code. */
  orsApiKey: string
  /** Objectif de pas par défaut, pré-remplit l'écran principal. */
  defaultGoal: number
  /** Préfère le tracé le plus plat parmi plusieurs générés (voir orsClient.ts). */
  avoidHills: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  heightCm: 170,
  homeLat: null,
  homeLng: null,
  orsApiKey: '',
  defaultGoal: 10000,
  avoidHills: false,
}

/** Une position est utilisable comme domicile dès qu'elle a des coordonnées. */
export function isHomeSet(settings: Settings): boolean {
  return settings.homeLat !== null && settings.homeLng !== null
}

export interface RouteResult {
  /** Tracé de la boucle, en [lat, lng] (ordre Leaflet). */
  coordinates: [number, number][]
  /** Altitude en mètres, un par point de `coordinates` (même index). */
  elevations: number[]
  /** Distance réelle retournée par ORS, en mètres (rarement égale à la distance demandée). */
  distanceMeters: number
  /** Durée de marche estimée par ORS, en secondes. */
  durationSeconds: number
  /** Dénivelé positif cumulé (D+), en mètres. */
  ascentMeters: number
  /** Dénivelé négatif cumulé (D-), en mètres. */
  descentMeters: number
  /** Seed utilisé pour cette génération, permet de recréer/varier le tracé. */
  seed: number
}
