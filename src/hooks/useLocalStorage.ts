import { useEffect, useState } from 'react'

/**
 * Miroir d'un état React dans localStorage sous `key`, sérialisé en JSON.
 * Lecture paresseuse au montage, écriture à chaque changement.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key)
      return raw !== null ? (JSON.parse(raw) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Stockage plein ou indisponible (navigation privée) : on continue en mémoire.
    }
  }, [key, value])

  return [value, setValue] as const
}
