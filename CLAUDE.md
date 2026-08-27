# RULES

- Ne fait pas de test toi même, j'ai déjà un npm run dev de mon côté et je te dirai directement les problèmes
- `npm run build` (tsc -b + vite build) et `npx oxlint` sont OK à lancer pour vérifier que ça compile/lint — ce n'est pas "tester l'app", contrairement à `npm run dev` / `npm run preview`.

# Projet : Pas restants

PWA perso (pas de backend) qui calcule la distance restante pour atteindre un
objectif de pas quotidien, puis génère un trajet piéton réel (vraies rues) en
boucle autour du domicile via openrouteservice. Cahier des charges complet et
source de vérité fonctionnelle : **[PRD.md](./PRD.md)** — le lire avant toute
évolution de features, il détaille les écrans, la formule de longueur de pas,
les points d'attention et la roadmap V2.

## Stack

Vite + React 19 + TypeScript, `react-leaflet`/Leaflet pour la carte OSM,
openrouteservice (`directions`, profil `foot-walking`, option `round_trip`)
pour générer la boucle, `vite-plugin-pwa` pour le manifest/service worker.
Tout l'état persistant vit en `localStorage` (clé `pas-restants:settings`).
Lint : oxlint (pas d'ESLint).

## Architecture

```
src/
  components/SettingsForm.tsx   # onboarding + édition paramètres, carte avec marker déplaçable
  components/StepsForm.tsx       # anneau de progression, pas faits / objectif, CTA "Générer"
  components/RouteMap.tsx         # carte + tracé, stats, "Régénérer", CTA "Démarrer" -> Google Maps
  components/StepRing.tsx          # anneau SVG de progression (élément signature du design)
  components/LoadingDots.tsx        # indicateur "génération" : grille pixel + libellé shimmer + chrono
  components/icons.tsx              # set d'icônes SVG maison (pas d'emoji, pas de lib externe)
  hooks/useLocalStorage.ts       # generic localStorage <-> useState
  hooks/useGeolocation.ts         # capture ponctuelle position (pas de watch continu)
  lib/stepLength.ts                # taille -> longueur de pas (coeff 0.415) -> conversions
  lib/orsClient.ts                  # fetch ORS + correction d'écart, erreurs en français (OrsError)
  lib/googleMaps.ts                  # construit l'URL Google Maps (mode piéton) depuis un trajet ORS
  lib/gpx.ts                          # export GPX (tracé complet) + partage natif ou téléchargement
  lib/formatDuration.ts                # secondes -> "18 min" / "1 h 24"
  lib/geocoding.ts                      # recherche d'adresse (ORS Geocoding/Pelias, même clé API)
  lib/leafletIcons.ts                # fix des icônes marker par défaut (chemins cassés par Vite)
  types.ts                            # Settings, RouteResult, DEFAULT_SETTINGS, isHomeSet()
  App.tsx                              # état racine : settings, écran actif, trajet/erreur/loading
```

`App.tsx` bascule entre l'écran `settings` et `main` selon `isHomeSet(settings)`
(pas de router, l'app est trop petite pour ça). Le trajet généré (`RouteResult`)
n'est pas persisté : régénéré à chaque session.

## Design

Direction "app santé/fitness native" (Apple Santé / Google Fit), demandée
explicitement — pas un style "généré par IA" (pas de dégradé violet/glassmorphism
par défaut). Palette vert forêt/menthe + corail en accent ponctuel, `system-ui`
partout (rendu natif SF Pro/Roboto selon l'OS, cohérent avec l'objectif "app").
Élément signature : l'anneau de progression (`StepRing`) sur l'écran principal.
Icônes maison en SVG (`components/icons.tsx`), aucun emoji dans l'UI. `#root`
est cadré en largeur "téléphone" (max 430px) ; au-delà de 640px de large, il
prend une apparence de carte flottante (coins arrondis + ombre) façon mockup
d'app plutôt que de s'étirer en pleine largeur desktop.

## Points à connaître

- **Overshoot ORS** : `options.round_trip` d'openrouteservice peut largement
  dépasser la distance demandée (observé : jusqu'à ~2.3x, ex. 10 000 pas
  demandés -> trajet de ~23 000 pas). `lib/orsClient.ts` corrige ça avec une
  boucle de retentatives (jusqu'à 3) qui ajuste la longueur demandée
  proportionnellement à l'écart observé, et garde la tentative la plus proche
  de la cible. `points` est fixé à 4-6 (jamais 3, qui aggrave l'écart).
- **Bouton "Démarrer"** (`RouteMap`) ouvre Google Maps en mode piéton
  (`lib/googleMaps.ts`) avec origin = destination = domicile et des waypoints
  échantillonnés le long du tracé ORS. Plafonné à 9 : c'est la limite du
  produit Google Maps lui-même ("jusqu'à 9 étapes"), pas une limite technique
  de notre code — impossible d'y passer les centaines de points renvoyés par
  ORS, même via l'URL. Google recalcule donc son propre itinéraire entre ces
  points plutôt que de rejouer le tracé ORS à l'identique rue pour rue.
- **Durée du trajet** : `RouteResult.durationSeconds` vient de
  `properties.summary.duration` de la réponse ORS, formatée par
  `lib/formatDuration.ts` ("18 min", "1 h 24"), affichée dans `RouteMap` à
  côté de la distance réelle et des pas correspondants.
- **Dénivelé D+/D-** : la requête ORS passe `elevation: true` (en plus de
  `options.round_trip`), ce qui fait renvoyer par ORS des coordonnées 3D
  (`[lng, lat, altitude]`). `lib/orsClient.ts` en déduit `elevations[]`,
  `ascentMeters`/`descentMeters` par simple somme des écarts consécutifs
  (pas de lissage : peut légèrement surestimer sur un DEM bruité). L'altitude
  par point est aussi incluse dans le GPX exporté (`<ele>`), utile pour le
  profil altimétrique dans OsmAnd/Komoot.
- **Export GPX** (`lib/gpx.ts`, bouton icône à côté de "Démarrer") : construit
  un GPX avec le tracé complet (tous les points, contrairement à Google Maps)
  et le propose via `navigator.share` (feuille de partage mobile, l'utilisateur
  choisit l'app compatible installée : OsmAnd, Komoot, Organic Maps...), avec
  repli en téléchargement direct du fichier si l'API n'est pas dispo.
- **"Éviter les côtes"** (`Settings.avoidHills`, interrupteur dans les
  paramètres) : ORS n'a pas de paramètre anti-côtes pour le profil piéton
  (contrairement au vélo, qui a `steepness_difficulty`). Le seul levier
  réaliste, implémenté dans `lib/orsClient.ts` : générer 2 tracés
  supplémentaires à la même distance visée (seed différents) et garder celui
  avec le plus petit `ascentMeters` parmi ceux qui respectent la tolérance de
  distance. Une préférence heuristique, pas une garantie stricte — à ne pas
  présenter comme un vrai évitement de dénivelé.
- **Recherche d'adresse** (`lib/geocoding.ts`, dans le groupe "Domicile" des
  paramètres) : utilise l'API Geocoding d'openrouteservice (Pelias,
  `/geocode/search`), donc la même clé API que le reste de l'app — pas de
  service tiers ni de 2e clé. Sélectionner un résultat recentre la carte via
  `mapRef.current.setView(...)` (ref sur `MapContainer`), volontairement
  imperative et pas via un `useEffect` sur `homeLat/homeLng` : sinon la carte
  se recentrerait aussi à chaque clic/drag manuel du marker sur la carte, ce
  qui serait gênant (on veut recentrer seulement après géoloc/recherche
  d'adresse, pas après une interaction directe sur la carte).
- **`LoadingDots`** (`StepsForm`, sous le CTA pendant `isGenerating`) : fourni
  par l'utilisateur en JSX/Tailwind/Next ("use client", classes `bg-ink`...),
  réadapté ici en CSS pur avec nos tokens (`--text`/`--text-muted`) — pas de
  Tailwind dans ce projet. Seule la variante par défaut (grille chevron,
  cellules carrées) a été portée, pas les variantes Dots/Orbit du snippet
  d'origine ni le prop `variant`, non utilisées. Pas branché sur le
  "Régénérer" de `RouteMap` (qui a déjà son icône de spin dédiée).
- **Cadre "téléphone" sur desktop (`#root` >= 640px)** : c'est un cadre à
  hauteur fixe avec `overflow-y: auto`, pas `overflow: hidden` — sinon tout
  contenu plus haut que le cadre est silencieusement coupé, sans rien à
  scroller (bug déjà rencontré). Le scroll doit se faire à l'intérieur du
  cadre, pas sur la page.
- **Clé API + taille** : regroupées dans une section "Avancé" repliable des
  paramètres (`<details>` contrôlé), ouverte par défaut seulement à
  l'onboarding. La clé API est un champ masqué type mot de passe avec bouton
  œil pour la révéler.
- **Icônes PWA** : générées par script (`sips` en CLI macOS, pas d'outil de
  rasterisation SVG dédié dispo) — pictogramme "empreinte de pas" sur fond
  vert (`#1f6f54`, couleur `--primary`). Fichiers dans `public/`
  (`pwa-192x192.png`, `pwa-512x512.png`, `pwa-maskable-512x512.png`,
  `apple-touch-icon.png`, `favicon.svg`). À remplacer par un vrai design si
  besoin un jour.
- **Pas de fallback hors-ligne en V1** : conforme au PRD, assumé. Le service
  worker précache le shell de l'app mais n'intercepte pas les appels ORS.
- **Clé API ORS** : jamais en dur dans le code, saisie utilisateur stockée en
  `localStorage` uniquement (voir PRD, section "points d'attention").
- **Distance ORS jamais exacte** : même avec la correction d'écart, toujours
  afficher la distance réelle retournée + le nombre de pas recalculé
  (`RouteMap`), ne pas laisser croire que c'est pile la valeur demandée.
