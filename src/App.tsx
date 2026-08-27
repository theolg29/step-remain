import { useState } from 'react'
import RouteMap from './components/RouteMap'
import SettingsForm from './components/SettingsForm'
import StepsForm from './components/StepsForm'
import { SlidersIcon } from './components/icons'
import { useLocalStorage } from './hooks/useLocalStorage'
import { OrsError, generateRoundTripRoute } from './lib/orsClient'
import { DEFAULT_SETTINGS, isHomeSet } from './types'
import type { RouteResult, Settings } from './types'
import './App.css'

type View = 'settings' | 'main'

export default function App() {
  const [settings, setSettings] = useLocalStorage<Settings>(
    'pas-restants:settings',
    DEFAULT_SETTINGS,
  )
  const [view, setView] = useState<View>(() => (isHomeSet(settings) ? 'main' : 'settings'))
  const [route, setRoute] = useState<RouteResult | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Distance visée par le dernier appel réussi, réutilisée par "Régénérer".
  const [lastTarget, setLastTarget] = useState<number | null>(null)

  // Configuration incomplète : on force l'écran paramètres quel que soit `view`.
  const effectiveView: View = isHomeSet(settings) ? view : 'settings'

  const handleSaveSettings = (next: Settings) => {
    setSettings(next)
    setView('main')
  }

  const runGeneration = async (distanceMeters: number) => {
    if (!isHomeSet(settings)) return
    setIsGenerating(true)
    setError(null)
    try {
      // 4 à 6 points : fait varier la forme de la boucle (voir PRD). En dessous
      // de 4, ORS a tendance à largement dépasser la distance demandée.
      const points = 4 + Math.floor(Math.random() * 3)
      const result = await generateRoundTripRoute({
        apiKey: settings.orsApiKey,
        homeLat: settings.homeLat as number,
        homeLng: settings.homeLng as number,
        distanceMeters,
        points,
        seed: Date.now(),
        avoidHills: settings.avoidHills,
      })
      setRoute(result)
      setLastTarget(distanceMeters)
    } catch (err) {
      setRoute(null)
      setError(
        err instanceof OrsError
          ? err.message
          : 'Erreur inattendue lors de la génération du trajet.',
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerate = () => {
    if (lastTarget !== null) runGeneration(lastTarget)
  }

  if (effectiveView === 'settings') {
    return (
      <div className="app">
        <SettingsForm
          settings={settings}
          isOnboarding={!isHomeSet(settings)}
          onSave={handleSaveSettings}
          onCancel={() => setView('main')}
        />
      </div>
    )
  }

  const missingApiKey = !settings.orsApiKey
  const disabledReason = missingApiKey
    ? 'Ajoute ta clé API openrouteservice dans les paramètres pour générer un trajet.'
    : undefined

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="app-header__eyebrow">Aujourd'hui</p>
          <h1>Pas restants</h1>
        </div>
        <button
          type="button"
          className="icon-button"
          onClick={() => setView('settings')}
          aria-label="Réglages"
        >
          <SlidersIcon />
        </button>
      </header>
      <main className="app-main">
        <StepsForm
          heightCm={settings.heightCm}
          defaultGoal={settings.defaultGoal}
          onGenerate={(distanceMeters) => runGeneration(distanceMeters)}
          isGenerating={isGenerating}
          disabled={missingApiKey}
          disabledReason={disabledReason}
        />
        {(route || error) && (
          <RouteMap
            home={{ lat: settings.homeLat as number, lng: settings.homeLng as number }}
            heightCm={settings.heightCm}
            route={route}
            isGenerating={isGenerating}
            error={error}
            onRegenerate={handleRegenerate}
          />
        )}
      </main>
    </div>
  )
}
