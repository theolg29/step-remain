export interface Settings {
  /** Taille de l'utilisateur en cm, sert à calculer la longueur de pas. */
  heightCm: number
  /** Position du domicile, point de départ/arrivée de la boucle. */
  homeLat: number | null
  homeLng: number | null
  /** Clé API openrouteservice, saisie par l'utilisateur ou issue de .env. */
  orsApiKey: string
  /** Objectif de pas par défaut, pré-remplit l'écran principal. */
  defaultGoal: number
  /** Préfère le tracé le plus plat parmi plusieurs générés. */
  avoidHills: boolean
  /** Indique si l'onboarding initial a été complété. */
  onboardingCompleted?: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  heightCm: 170,
  homeLat: null,
  homeLng: null,
  orsApiKey: (import.meta.env.VITE_ORS_API_KEY as string | undefined) || '',
  defaultGoal: 10000,
  avoidHills: false,
  onboardingCompleted: false,
}

/** Une position est utilisable comme domicile dès qu'elle a des coordonnées. */
export function isHomeSet(settings: Settings): boolean {
  return settings.homeLat !== null && settings.homeLng !== null
}

/** Vérifie si l'onboarding initial est déjà complété. */
export function isOnboardingCompleted(settings: Settings): boolean {
  return Boolean(settings.onboardingCompleted || isHomeSet(settings))
}

export interface RouteResult {
  /** Tracé de la boucle, en [lat, lng] (ordre Leaflet). */
  coordinates: [number, number][]
  /** Altitude en mètres, un par point de `coordinates` (même index). */
  elevations: number[]
  /** Distance réelle retournée par ORS, en mètres. */
  distanceMeters: number
  /** Durée de marche estimée par ORS, en secondes. */
  durationSeconds: number
  /** Dénivelé positif cumulé (D+), en mètres. */
  ascentMeters: number
  /** Dénivelé négatif cumulé (D-), en mètres. */
  descentMeters: number
  /** Seed utilisé pour cette génération. */
  seed: number
}

export interface SavedRoute {
  id: string
  createdAt: string
  name: string
  route: RouteResult
  stepsDone: number
  stepsGoal: number
  isFavorite: boolean
}


