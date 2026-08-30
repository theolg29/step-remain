/**
 * Coefficient moyen utilisé pour estimer la longueur de pas à partir de la taille.
 * Approximation standard de la marche, ne dépend pas de l'allure — précision
 * suffisante pour ce cas d'usage (voir PRD.md).
 */
const STEP_LENGTH_COEFFICIENT = 0.415

/** Longueur d'un pas en centimètres, à partir de la taille en cm. */
export function cmToStepLengthCm(heightCm: number): number {
  if (!Number.isFinite(heightCm) || heightCm <= 0) return 0
  return heightCm * STEP_LENGTH_COEFFICIENT
}

/** Longueur d'un pas en mètres, à partir de la taille en cm. */
export function stepLengthMeters(heightCm: number): number {
  return cmToStepLengthCm(heightCm) / 100
}

/** Distance parcourue (m) pour un nombre de pas donné. */
export function stepsToMeters(steps: number, heightCm: number): number {
  if (!Number.isFinite(steps) || steps <= 0) return 0
  return steps * stepLengthMeters(heightCm)
}

/** Nombre de pas correspondant à une distance donnée (m), arrondi. */
export function metersToSteps(meters: number, heightCm: number): number {
  const stepLength = stepLengthMeters(heightCm)
  if (stepLength <= 0 || !Number.isFinite(meters) || meters <= 0) return 0
  return Math.round(meters / stepLength)
}
