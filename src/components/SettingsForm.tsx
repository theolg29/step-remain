import { useEffect, useRef, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import type { LeafletMouseEvent, Map as LeafletMap } from 'leaflet'
import { useGeolocation } from '../hooks/useGeolocation'
import { type AddressResult, searchAddress } from '../lib/geocoding'
import { fixLeafletDefaultIcon } from '../lib/leafletIcons'
import { OrsError } from '../lib/orsClient'
import type { Settings } from '../types'
import {
  ChevronDownIcon,
  CloseIcon,
  EyeIcon,
  EyeOffIcon,
  PinIcon,
  SearchIcon,
} from './icons'
import './SettingsForm.css'

fixLeafletDefaultIcon()

// Paris par défaut tant qu'aucune position n'a été choisie.
const FALLBACK_CENTER: [number, number] = [48.8566, 2.3522]

interface SettingsFormProps {
  settings: Settings
  isOnboarding: boolean
  onSave: (settings: Settings) => void
  onCancel: () => void
}

function HomePicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event: LeafletMouseEvent) {
      onPick(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

export default function SettingsForm({
  settings,
  isOnboarding,
  onSave,
  onCancel,
}: SettingsFormProps) {
  const [heightCm, setHeightCm] = useState(settings.heightCm)
  const [orsApiKey, setOrsApiKey] = useState(settings.orsApiKey)
  const [defaultGoal, setDefaultGoal] = useState(settings.defaultGoal)
  const [avoidHills, setAvoidHills] = useState(settings.avoidHills)
  const [homeLat, setHomeLat] = useState(settings.homeLat)
  const [homeLng, setHomeLng] = useState(settings.homeLng)
  const [showApiKey, setShowApiKey] = useState(false)
  // Clé et taille se règlent une fois puis se font oublier : repliées par
  // défaut, sauf à l'onboarding où elles sont requises pour continuer.
  const [advancedOpen, setAdvancedOpen] = useState(isOnboarding)
  const { loading: locating, error: geoError, locate } = useGeolocation()
  const [addressQuery, setAddressQuery] = useState('')
  const [addressResults, setAddressResults] = useState<AddressResult[]>([])
  const [addressSearching, setAddressSearching] = useState(false)
  const [addressError, setAddressError] = useState<string | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)

  // Au premier lancement, capture automatique de la position une fois.
  useEffect(() => {
    if (isOnboarding && settings.homeLat === null) {
      locate().then((pos) => {
        if (pos) {
          setHomeLat(pos.lat)
          setHomeLng(pos.lng)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLocate = async () => {
    const pos = await locate()
    if (pos) {
      setHomeLat(pos.lat)
      setHomeLng(pos.lng)
      mapRef.current?.setView([pos.lat, pos.lng], 16)
    }
  }

  const handleAddressSearch = async () => {
    if (!addressQuery.trim()) return
    setAddressSearching(true)
    setAddressError(null)
    setAddressResults([])
    try {
      const results = await searchAddress(orsApiKey, addressQuery)
      if (results.length === 0) {
        setAddressError('Aucune adresse trouvée.')
      }
      setAddressResults(results)
    } catch (err) {
      setAddressError(
        err instanceof OrsError ? err.message : "Erreur lors de la recherche d'adresse.",
      )
    } finally {
      setAddressSearching(false)
    }
  }

  const handleSelectAddress = (result: AddressResult) => {
    setHomeLat(result.lat)
    setHomeLng(result.lng)
    setAddressResults([])
    setAddressQuery('')
    mapRef.current?.setView([result.lat, result.lng], 16)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    onSave({
      heightCm,
      orsApiKey: orsApiKey.trim(),
      defaultGoal,
      avoidHills,
      homeLat,
      homeLng,
    })
  }

  const mapCenter: [number, number] =
    homeLat !== null && homeLng !== null ? [homeLat, homeLng] : FALLBACK_CENTER
  const isValid = heightCm > 0 && defaultGoal > 0 && homeLat !== null && homeLng !== null

  return (
    <form className="settings-screen" onSubmit={handleSubmit}>
      <header className="settings-screen__header">
        <h1>{isOnboarding ? 'Bienvenue' : 'Réglages'}</h1>
        {!isOnboarding && (
          <button
            type="button"
            className="icon-button"
            onClick={onCancel}
            aria-label="Fermer les réglages"
          >
            <CloseIcon />
          </button>
        )}
      </header>
      <p className="settings-screen__intro">
        {isOnboarding
          ? "Quelques infos pour calculer tes trajets, tout reste sur ton appareil."
          : 'Tout reste enregistré sur ton appareil.'}
      </p>

      <section className="settings-group">
        <h2>Objectif</h2>
        <label className="settings-row">
          <span>Pas par jour</span>
          <input
            type="number"
            inputMode="numeric"
            min={1000}
            step={500}
            value={defaultGoal}
            onChange={(e) => setDefaultGoal(Number(e.target.value))}
            required
          />
        </label>
      </section>

      <section className="settings-group">
        <h2>Trajet</h2>
        <label className="switch-row">
          <span className="switch-row__text">
            <span className="switch-row__title">Éviter les côtes</span>
            <span className="switch-row__hint">
              Génère plusieurs tracés et garde le plus plat. Une préférence, pas
              une garantie : ORS n'a pas d'option anti-côtes pour la marche.
            </span>
          </span>
          <span className="switch">
            <input
              type="checkbox"
              checked={avoidHills}
              onChange={(e) => setAvoidHills(e.target.checked)}
            />
            <span className="switch__track" />
          </span>
        </label>
      </section>

      <section className="settings-group">
        <h2>Domicile</h2>
        <p className="settings-group__hint">
          Départ et arrivée du trajet. Cherche ton adresse, touche la carte ou
          déplace le marker pour ajuster.
        </p>
        <div className="settings-address">
          <div className="settings-address__row">
            <input
              type="text"
              placeholder="Chercher une adresse…"
              value={addressQuery}
              onChange={(e) => setAddressQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddressSearch()
                }
              }}
            />
            <button
              type="button"
              className="icon-button"
              onClick={handleAddressSearch}
              disabled={addressSearching || !addressQuery.trim()}
              aria-label="Rechercher cette adresse"
            >
              <SearchIcon />
            </button>
          </div>
          {addressError && <p className="settings-screen__error">{addressError}</p>}
          {addressResults.length > 0 && (
            <ul className="settings-address__results">
              {addressResults.map((result) => (
                <li key={`${result.lat},${result.lng}`}>
                  <button type="button" onClick={() => handleSelectAddress(result)}>
                    <PinIcon />
                    {result.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="settings-map">
          <MapContainer
            ref={mapRef}
            center={mapCenter}
            zoom={homeLat !== null ? 16 : 12}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <HomePicker
              onPick={(lat, lng) => {
                setHomeLat(lat)
                setHomeLng(lng)
              }}
            />
            {homeLat !== null && homeLng !== null && (
              <Marker
                position={[homeLat, homeLng]}
                draggable
                eventHandlers={{
                  dragend: (e) => {
                    const pos = e.target.getLatLng()
                    setHomeLat(pos.lat)
                    setHomeLng(pos.lng)
                  },
                }}
              />
            )}
          </MapContainer>
        </div>
        <button
          type="button"
          className="settings-locate"
          onClick={handleLocate}
          disabled={locating}
        >
          <PinIcon />
          {locating ? 'Localisation…' : 'Me localiser'}
        </button>
        {geoError && <p className="settings-screen__error">{geoError}</p>}
      </section>

      <details
        className="settings-group settings-group--collapsible"
        open={advancedOpen}
        onToggle={(e) => setAdvancedOpen(e.currentTarget.open)}
      >
        <summary>
          <h2>Avancé</h2>
          <ChevronDownIcon className="settings-group__chevron" />
        </summary>
        <div className="settings-group__content">
          <label className="settings-row">
            <span>Taille (cm)</span>
            <input
              type="number"
              inputMode="numeric"
              min={100}
              max={250}
              value={heightCm}
              onChange={(e) => setHeightCm(Number(e.target.value))}
              required
            />
          </label>

          <div className="settings-row">
            <span>
              Clé API openrouteservice
              <a
                href="https://openrouteservice.org/dev/#/signup"
                target="_blank"
                rel="noreferrer"
              >
                Créer une clé gratuite
              </a>
            </span>
            <div className="settings-key">
              <input
                type={showApiKey ? 'text' : 'password'}
                autoComplete="off"
                spellCheck={false}
                placeholder="Clé API"
                value={orsApiKey}
                onChange={(e) => setOrsApiKey(e.target.value)}
              />
              <button
                type="button"
                className="settings-key__toggle"
                onClick={() => setShowApiKey((v) => !v)}
                aria-label={showApiKey ? 'Masquer la clé' : 'Afficher la clé'}
              >
                {showApiKey ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>
        </div>
      </details>

      <div className="settings-screen__actions">
        {!isOnboarding && (
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Annuler
          </button>
        )}
        <button type="submit" className="btn btn--primary btn--pill" disabled={!isValid}>
          {isOnboarding ? 'Commencer' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}
