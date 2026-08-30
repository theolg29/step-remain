import { useState } from 'react'
import Onboarding from './components/Onboarding'
import RouteMap from './components/RouteMap'
import SavedRoutesModal from './components/SavedRoutesModal'
import SettingsForm from './components/SettingsForm'
import StepsForm from './components/StepsForm'
import { HistoryIcon, SlidersIcon } from './components/icons'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useSavedRoutes } from './hooks/useSavedRoutes'
import { OrsError, generateRoundTripRoute } from './lib/orsClient'
import { DEFAULT_SETTINGS, isHomeSet, isOnboardingCompleted } from './types'
import type { RouteResult, Settings } from './types'
import './App.css'

export default function App() {
  const [settings, setSettings] = useLocalStorage<Settings>(
    'pas-restants:settings',
    DEFAULT_SETTINGS,
  )
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSavedRoutesOpen, setIsSavedRoutesOpen] = useState(false)
  const [isReviewingOnboarding, setIsReviewingOnboarding] = useState(false)
  const [route, setRoute] = useState<RouteResult | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastTarget, setLastTarget] = useState<number | null>(null)

  const {
    savedRoutes,
    saveRoute,
    removeRoute,
    toggleFavorite,
    isRouteSaved,
  } = useSavedRoutes()

  const isOnboarded = isOnboardingCompleted(settings)
  const showOnboarding = !isOnboarded || isReviewingOnboarding

  const handleCompleteOnboarding = (nextSettings: Settings) => {
    setSettings(nextSettings)
    setIsReviewingOnboarding(false)
  }

  const handleCloseOnboarding = () => {
    setIsReviewingOnboarding(false)
  }

  const handleRestartOnboarding = () => {
    setIsSettingsOpen(false)
    setIsReviewingOnboarding(true)
  }

  const handleSaveSettings = (nextSettings: Settings) => {
    setSettings(nextSettings)
    setIsSettingsOpen(false)
  }

  const handleCloseModals = () => {
    setIsSettingsOpen(false)
    setIsSavedRoutesOpen(false)
  }

  const effectiveApiKey =
    (settings.orsApiKey?.trim() ||
      (import.meta.env.VITE_ORS_API_KEY as string | undefined) ||
      '').trim()

  const runGeneration = async (distanceMeters: number) => {
    if (!isHomeSet(settings)) return
    setIsGenerating(true)
    setError(null)
    try {
      const result = await generateRoundTripRoute({
        apiKey: effectiveApiKey,
        homeLat: settings.homeLat as number,
        homeLng: settings.homeLng as number,
        distanceMeters,
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

  const handleToggleSaveCurrentRoute = () => {
    if (!route) return
    if (isRouteSaved(route)) {
      const existing = savedRoutes.find(
        (r) =>
          r.route.seed === route.seed &&
          Math.abs(r.route.distanceMeters - route.distanceMeters) < 5,
      )
      if (existing) removeRoute(existing.id)
    } else {
      saveRoute(route, undefined, 0, settings.defaultGoal)
    }
  }

  const handleSelectSavedRoute = (selectedRoute: RouteResult) => {
    setRoute(selectedRoute)
    setError(null)
    setLastTarget(selectedRoute.distanceMeters)
  }

  if (showOnboarding) {
    return (
      <div className="app-container app-container--onboarding">
        <Onboarding
          initialSettings={settings}
          onComplete={handleCompleteOnboarding}
          onClose={isOnboarded ? handleCloseOnboarding : undefined}
        />
      </div>
    )
  }

  const missingApiKey = !effectiveApiKey
  const disabledReason = missingApiKey
    ? 'Ajoute ta clé API openrouteservice dans les paramètres pour générer un trajet.'
    : undefined

  const isAnyModalOpen = isSettingsOpen || isSavedRoutesOpen

  return (
    <div className="app-container">
      {/* Main Screen */}
      <div className={`screen screen--main ${isAnyModalOpen ? 'screen--main-receded' : ''}`}>
        <header className="app-header">
          <div>
            <p className="app-header__eyebrow">Aujourd'hui</p>
            <h1>Pas restants</h1>
          </div>
          <div className="app-header__actions">
            <button
              type="button"
              className="icon-button"
              onClick={() => setIsSavedRoutesOpen(true)}
              aria-label="Mes parcours"
              title="Mes parcours enregistrés"
            >
              <HistoryIcon />
              {savedRoutes.length > 0 && (
                <span className="icon-badge">{savedRoutes.length}</span>
              )}
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={() => setIsSettingsOpen(true)}
              aria-label="Réglages"
              title="Réglages"
            >
              <SlidersIcon />
            </button>
          </div>
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
              isSaved={isRouteSaved(route)}
              onToggleSave={handleToggleSaveCurrentRoute}
            />
          )}
        </main>
      </div>

      {/* Backdrop overlay for modal sheets */}
      <div
        className={`settings-backdrop ${isAnyModalOpen ? 'settings-backdrop--visible' : ''}`}
        onClick={handleCloseModals}
        aria-hidden="true"
      />

      {/* Saved Routes Modal Sheet */}
      <div
        className={`screen screen--settings ${isSavedRoutesOpen ? 'screen--settings-open' : ''}`}
        aria-hidden={!isSavedRoutesOpen}
      >
        <SavedRoutesModal
          isOpen={isSavedRoutesOpen}
          onClose={() => setIsSavedRoutesOpen(false)}
          savedRoutes={savedRoutes}
          onSelectRoute={handleSelectSavedRoute}
          onToggleFavorite={toggleFavorite}
          onRemoveRoute={removeRoute}
          home={
            isHomeSet(settings)
              ? { lat: settings.homeLat as number, lng: settings.homeLng as number }
              : null
          }
          heightCm={settings.heightCm}
        />
      </div>

      {/* Settings Modal Sheet */}
      <div
        className={`screen screen--settings ${isSettingsOpen ? 'screen--settings-open' : ''}`}
        aria-hidden={!isSettingsOpen}
      >
        <SettingsForm
          settings={settings}
          onSave={handleSaveSettings}
          onCancel={() => setIsSettingsOpen(false)}
          onRestartOnboarding={handleRestartOnboarding}
        />
      </div>
    </div>
  )
}

