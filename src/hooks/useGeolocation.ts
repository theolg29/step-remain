import { useCallback, useState } from 'react'

interface GeolocationState {
  loading: boolean
  error: string | null
}

/**
 * Capture ponctuelle de la position (bouton "Me localiser" en configuration).
 * Ne watch pas en continu : le domicile est un point fixe, ajustable ensuite
 * à la main sur la carte.
 */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    loading: false,
    error: null,
  })

  const locate = useCallback((): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        setState({
          loading: false,
          error: 'Géolocalisation non disponible sur ce navigateur, place le marker manuellement.',
        })
        resolve(null)
        return
      }

      setState({ loading: true, error: null })
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setState({ loading: false, error: null })
          resolve({ lat: position.coords.latitude, lng: position.coords.longitude })
        },
        (err) => {
          setState({
            loading: false,
            error: err.message || 'Position indisponible, place le marker manuellement.',
          })
          resolve(null)
        },
        { enableHighAccuracy: true, timeout: 10000 },
      )
    })
  }, [])

  return { ...state, locate }
}
