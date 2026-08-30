import { useEffect, useRef, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import type { LeafletMouseEvent, Map as LeafletMap } from 'leaflet'
import { useGeolocation } from '../hooks/useGeolocation'
import { type AddressResult, searchAddress } from '../lib/geocoding'
import { fixLeafletDefaultIcon } from '../lib/leafletIcons'
import { OrsError } from '../lib/orsClient'
import { cmToStepLengthCm } from '../lib/stepLength'
import type { Settings } from '../types'
import {
  ChevronLeftIcon,
  CloseIcon,
  EyeIcon,
  EyeOffIcon,
  PinIcon,
  RouteIcon,
  SearchIcon,
  ShieldCheckIcon,
  TargetGoalIcon,
} from './icons'
import './Onboarding.css'

fixLeafletDefaultIcon()

const FALLBACK_CENTER: [number, number] = [48.8566, 2.3522]

interface OnboardingProps {
  initialSettings: Settings
  onComplete: (settings: Settings) => void
  onClose?: () => void
}

function HomePicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event: LeafletMouseEvent) {
      onPick(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

function RouteLineAnimation() {
  const routePath =
    'M 54,96 C 54,68 70,44 100,40 L 144,40 C 162,40 178,28 198,30 L 238,34 C 270,38 290,62 288,96 C 286,126 268,148 238,152 L 192,154 C 170,155 156,164 134,162 L 96,156 C 68,150 54,128 54,96 Z'

  return (
    <div className="route-anim" aria-hidden="true">
      <svg
        viewBox="0 0 340 190"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="route-anim__svg"
      >
        <defs>
          <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7df56c" />
            <stop offset="100%" stopColor="#5ee44e" />
          </linearGradient>
        </defs>

        {/* Faint background road/track */}
        <path
          d={routePath}
          stroke="rgba(125, 245, 108, 0.12)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Animated tracing pedestrian route */}
        <path
          className="route-anim__path"
          d={routePath}
          stroke="url(#routeGrad)"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Moving walker beacon dot along the route */}
        <circle r="4.5" fill="#7df56c">
          <animateMotion dur="6s" repeatCount="indefinite" path={routePath} />
        </circle>
        <circle r="1.8" fill="#061d18">
          <animateMotion dur="6s" repeatCount="indefinite" path={routePath} />
        </circle>

        {/* Home node marker */}
        <circle cx="54" cy="96" r="9" fill="rgba(125, 245, 108, 0.2)" className="route-anim__pulse" />
        <circle cx="54" cy="96" r="4.5" fill="#7df56c" />
        <circle cx="54" cy="96" r="1.8" fill="#061d18" />

        {/* Clean floating badges */}
        <g transform="translate(24, 116)">
          <rect
            x="0"
            y="0"
            width="68"
            height="20"
            rx="5"
            fill="#0d2721"
            stroke="#1a4238"
            strokeWidth="1"
          />
          <text
            x="34"
            y="14"
            fill="#f1fbf4"
            fontSize="9.5"
            fontWeight="700"
            letterSpacing="0.04em"
            textAnchor="middle"
            fontFamily="'Plus Jakarta Sans', sans-serif"
          >
            DOMICILE
          </text>
        </g>

        <g transform="translate(185, 16)">
          <rect
            x="0"
            y="0"
            width="112"
            height="24"
            rx="12"
            fill="#0d2721"
            stroke="#1a4238"
            strokeWidth="1"
          />
          <circle cx="13" cy="12" r="3" fill="#7df56c" />
          <text
            x="62"
            y="16"
            fill="#7df56c"
            fontSize="10.5"
            fontWeight="700"
            textAnchor="middle"
            fontFamily="'Plus Jakarta Sans', sans-serif"
          >
            4.2 km • Boucle
          </text>
        </g>
      </svg>
    </div>
  )
}

export default function Onboarding({ initialSettings, onComplete, onClose }: OnboardingProps) {
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Settings state during onboarding
  const [heightCm, setHeightCm] = useState(initialSettings.heightCm || 170)
  const [orsApiKey, setOrsApiKey] = useState(initialSettings.orsApiKey || '')
  const [defaultGoal, setDefaultGoal] = useState(initialSettings.defaultGoal || 10000)
  const [avoidHills, setAvoidHills] = useState(initialSettings.avoidHills || false)
  const [homeLat, setHomeLat] = useState<number | null>(initialSettings.homeLat)
  const [homeLng, setHomeLng] = useState<number | null>(initialSettings.homeLng)

  // Step 2 & 4 states
  const [showApiKey, setShowApiKey] = useState(false)
  const { loading: locating, error: geoError, locate } = useGeolocation()
  const [addressQuery, setAddressQuery] = useState('')
  const [addressResults, setAddressResults] = useState<AddressResult[]>([])
  const [addressSearching, setAddressSearching] = useState(false)
  const [addressError, setAddressError] = useState<string | null>(null)
  const [selectedAddressLabel, setSelectedAddressLabel] = useState<string | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)

  const hasConfiguredKey = Boolean(
    (import.meta.env.VITE_ORS_API_KEY as string | undefined)?.trim() ||
      initialSettings.orsApiKey?.trim(),
  )

  const TOTAL_STEPS = hasConfiguredKey ? 3 : 4

  const stepTitles = hasConfiguredKey
    ? ['Préparez vos marches', 'Point de départ', 'Profil de marche']
    : [
        'Préparez vos marches',
        'Point de départ',
        'Profil de marche',
        'Calcul des trajets',
      ]

  const goToStep = (nextStep: number) => {
    if (isTransitioning || nextStep === step) return
    setDirection(nextStep > step ? 'forward' : 'backward')
    setIsTransitioning(true)
    setStep(nextStep)
    setTimeout(() => setIsTransitioning(false), 300)
  }

  // Attempt auto-locate on step 1 if home not yet set
  useEffect(() => {
    if (step === 1 && homeLat === null) {
      locate().then((pos) => {
        if (pos) {
          setHomeLat(pos.lat)
          setHomeLng(pos.lng)
          mapRef.current?.setView([pos.lat, pos.lng], 16)
        }
      })
    }
  }, [step, homeLat, locate])

  // Resize map when reaching step 1
  useEffect(() => {
    if (step === 1) {
      const timer = setTimeout(() => {
        mapRef.current?.invalidateSize()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [step])

  const handleLocate = async () => {
    const pos = await locate()
    if (pos) {
      setHomeLat(pos.lat)
      setHomeLng(pos.lng)
      setSelectedAddressLabel(null)
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
    setSelectedAddressLabel(result.label)
    setAddressResults([])
    setAddressQuery('')
    mapRef.current?.setView([result.lat, result.lng], 16)
  }

  const handleFinish = () => {
    onComplete({
      heightCm,
      orsApiKey: orsApiKey.trim(),
      defaultGoal,
      avoidHills,
      homeLat,
      homeLng,
      onboardingCompleted: true,
    })
  }

  const mapCenter: [number, number] =
    homeLat !== null && homeLng !== null ? [homeLat, homeLng] : FALLBACK_CENTER

  const stepLengthCm = (cmToStepLengthCm(heightCm)).toFixed(1)
  const progressPercent = ((step + 1) / TOTAL_STEPS) * 100

  return (
    <div className="onboarding-flow">
      {/* Top Header (Transparent, Seamless) */}
      <header className="onboarding-header">
        <div className="onboarding-header__nav">
          {step > 0 ? (
            <button
              type="button"
              className="onboarding-nav-btn"
              onClick={() => goToStep(step - 1)}
              aria-label="Étape précédente"
            >
              <ChevronLeftIcon />
            </button>
          ) : (
            <div className="onboarding-nav-btn-placeholder" />
          )}

          {/* Clean Progress Pill Bar */}
          <div
            className="onboarding-progress-bar"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="onboarding-progress-bar__fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {onClose ? (
            <button
              type="button"
              className="onboarding-nav-btn"
              onClick={onClose}
              aria-label="Fermer le guide"
            >
              <CloseIcon />
            </button>
          ) : (
            <div className="onboarding-nav-btn-placeholder" />
          )}
        </div>

        <h1 className="onboarding-header__title">{stepTitles[step]}</h1>
      </header>

      {/* Main Body */}
      <div className={`onboarding-body onboarding-body--${direction}`}>
        {/* STEP 0: Welcome */}
        {step === 0 && (
          <div className="onboarding-step-content" key="step-0">
            <RouteLineAnimation />

            <div className="onboarding-points">
              <div className="onboarding-point">
                <div className="onboarding-point__icon">
                  <TargetGoalIcon />
                </div>
                <p>
                  <strong>Calcul précis selon votre taille</strong>, pour convertir chaque pas restant en distance exacte.
                </p>
              </div>

              <div className="onboarding-point">
                <div className="onboarding-point__icon">
                  <RouteIcon />
                </div>
                <p>
                  <strong>Boucles piétonnes sur mesure</strong>, avec départ et retour à votre domicile dans les vraies rues.
                </p>
              </div>

              <div className="onboarding-point">
                <div className="onboarding-point__icon">
                  <ShieldCheckIcon />
                </div>
                <p>
                  <strong>100% privé & confidentiel</strong>, toutes vos données restent uniquement sur votre appareil.
                </p>
              </div>
            </div>

            <div className="onboarding-bottom-actions">
              <button
                type="button"
                className="btn btn--primary btn--pill onboarding-cta-btn"
                onClick={() => goToStep(1)}
              >
                Commencer
              </button>
              {onClose && (
                <button type="button" className="onboarding-ghost-link" onClick={onClose}>
                  Plus tard
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 1: Departure & Location */}
        {step === 1 && (
          <div className="onboarding-step-content" key="step-1">
            <p className="onboarding-step-desc">
              Définissez votre domicile ou point de départ habituel pour tracer des boucles piétonnes autour de vous.
            </p>

            <div className="onboarding-address-row">
              <input
                type="text"
                placeholder="Rechercher une adresse ou une ville…"
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
                      <span>{result.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {selectedAddressLabel && (
              <div className="onboarding-selected-address">
                <PinIcon />
                <span>{selectedAddressLabel}</span>
              </div>
            )}

            <div className="settings-map onboarding-map-trainline">
              <MapContainer center={mapCenter} zoom={homeLat !== null ? 16 : 13} scrollWheelZoom>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <HomePicker
                  onPick={(lat, lng) => {
                    setHomeLat(lat)
                    setHomeLng(lng)
                    setSelectedAddressLabel(null)
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
                        setSelectedAddressLabel(null)
                      },
                    }}
                  />
                )}
              </MapContainer>
            </div>

            <button
              type="button"
              className="settings-locate onboarding-locate-btn"
              onClick={handleLocate}
              disabled={locating}
            >
              <PinIcon />
              {locating ? 'Localisation en cours…' : 'Utiliser ma position actuelle'}
            </button>
            {geoError && <p className="settings-screen__error">{geoError}</p>}

            <div className="onboarding-bottom-actions">
              <button
                type="button"
                className="btn btn--primary btn--pill onboarding-cta-btn"
                disabled={homeLat === null || homeLng === null}
                onClick={() => goToStep(2)}
              >
                Suivant
              </button>
              <button type="button" className="onboarding-ghost-link" onClick={() => goToStep(0)}>
                Étape précédente
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Goal & Stride Profile */}
        {step === 2 && (
          <div className="onboarding-step-content" key="step-2">
            <p className="onboarding-step-desc">
              Ces informations permettent d'adapter avec précision la longueur de vos foulées.
            </p>

            <div className="onboarding-form-card">
              <label className="settings-row">
                <span>Objectif de pas par jour</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1000}
                  step={500}
                  value={defaultGoal}
                  onChange={(e) => setDefaultGoal(Math.max(Number(e.target.value), 0))}
                  required
                />
              </label>

              <div className="onboarding-goal-chips">
                {[6000, 8000, 10000, 12000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`onboarding-chip ${defaultGoal === preset ? 'onboarding-chip--active' : ''}`}
                    onClick={() => setDefaultGoal(preset)}
                  >
                    {preset.toLocaleString('fr-FR')}
                  </button>
                ))}
              </div>
            </div>

            <div className="onboarding-form-card">
              <label className="settings-row">
                <span>Votre taille (cm)</span>
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
              <div className="onboarding-stride-banner">
                <span>Foulée estimée :</span>
                <strong>≈ {stepLengthCm} cm par pas</strong>
              </div>
            </div>

            <div className="onboarding-form-card">
              <label className="switch-row">
                <span className="switch-row__text">
                  <span className="switch-row__title">Éviter les côtes</span>
                  <span className="switch-row__hint">
                    Privilégie les trajets les plus plats dans les environs.
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
            </div>

            <div className="onboarding-bottom-actions">
              <button
                type="button"
                className="btn btn--primary btn--pill onboarding-cta-btn"
                disabled={heightCm <= 0 || defaultGoal <= 0}
                onClick={hasConfiguredKey ? handleFinish : () => goToStep(3)}
              >
                {hasConfiguredKey ? "C'est parti !" : 'Suivant'}
              </button>
              <button type="button" className="onboarding-ghost-link" onClick={() => goToStep(1)}>
                Étape précédente
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: API Key & Ready */}
        {step === 3 && (
          <div className="onboarding-step-content" key="step-3">
            <p className="onboarding-step-desc">
              Pour calculer des tracés sur les vraies rues piétonnes, l'application utilise OpenRouteService.
            </p>

            <div className="onboarding-points">
              <div className="onboarding-point">
                <div className="onboarding-point__icon">
                  <ShieldCheckIcon />
                </div>
                <p>
                  <strong>100% Gratuit</strong> — 2 000 trajets piétons offerts par jour sans carte bancaire.
                </p>
              </div>

              <div className="onboarding-point">
                <div className="onboarding-point__icon">
                  <TargetGoalIcon />
                </div>
                <p>
                  <strong>Stockage local</strong> — Votre clé reste sur ce téléphone et n'est jamais partagée.
                </p>
              </div>
            </div>

            <div className="onboarding-form-card">
              <div className="settings-row">
                <span>
                  Clé API OpenRouteService
                  <a
                    href="https://openrouteservice.org/dev/#/signup"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Créer une clé gratuite ↗
                  </a>
                </span>
                <div className="settings-key">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="Ex: 5b3ce3597851110001cf6248..."
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
              <p className="settings-group__hint">
                Vous pourrez aussi l'ajouter plus tard dans les réglages.
              </p>
            </div>

            <div className="onboarding-bottom-actions">
              <button
                type="button"
                className="btn btn--primary btn--pill onboarding-cta-btn"
                onClick={handleFinish}
              >
                C'est parti !
              </button>
              <button type="button" className="onboarding-ghost-link" onClick={() => goToStep(2)}>
                Étape précédente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
