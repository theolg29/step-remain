import { useLocalStorage } from './useLocalStorage'
import type { RouteResult, SavedRoute } from '../types'

const STORAGE_KEY = 'pas-restants:saved-routes'

export function useSavedRoutes() {
  const [savedRoutes, setSavedRoutes] = useLocalStorage<SavedRoute[]>(STORAGE_KEY, [])

  const saveRoute = (
    route: RouteResult,
    name?: string,
    stepsDone = 0,
    stepsGoal = 10000,
  ): SavedRoute => {
    const km = (route.distanceMeters / 1000).toLocaleString('fr-FR', {
      maximumFractionDigits: 1,
    })
    const defaultName = name?.trim() || `Boucle de ${km} km`

    const newEntry: SavedRoute = {
      id: `route-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      name: defaultName,
      route,
      stepsDone,
      stepsGoal,
      isFavorite: false,
    }

    setSavedRoutes((prev) => [newEntry, ...prev])
    return newEntry
  }

  const removeRoute = (id: string) => {
    setSavedRoutes((prev) => prev.filter((r) => r.id !== id))
  }

  const toggleFavorite = (id: string) => {
    setSavedRoutes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isFavorite: !r.isFavorite } : r)),
    )
  }

  const renameRoute = (id: string, name: string) => {
    setSavedRoutes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, name: name.trim() || r.name } : r)),
    )
  }

  const isRouteSaved = (route: RouteResult | null): boolean => {
    if (!route) return false
    return savedRoutes.some(
      (r) =>
        r.route.seed === route.seed &&
        Math.abs(r.route.distanceMeters - route.distanceMeters) < 5,
    )
  }

  return {
    savedRoutes,
    saveRoute,
    removeRoute,
    toggleFavorite,
    renameRoute,
    isRouteSaved,
  }
}
