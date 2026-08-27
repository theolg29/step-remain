# Pas restants

PWA perso qui calcule, à partir des pas déjà faits et d'un objectif quotidien,
la distance restante à parcourir, puis génère un trajet piéton réel (vraies
rues) en boucle autour du domicile pour couvrir cette distance.

Cahier des charges complet : [PRD.md](./PRD.md).

## Stack

Vite + React + TypeScript, Leaflet/react-leaflet pour la carte,
openrouteservice pour le calcul d'itinéraire, `vite-plugin-pwa` pour
l'installabilité. Pas de backend : tout tourne côté client, `localStorage`
pour la persistance (taille, position domicile, clé API ORS, objectif par
défaut).

## Lancer le projet

```bash
npm install
npm run dev
```

Il faut une clé API openrouteservice gratuite (lien fourni dans l'écran
paramètres de l'app, ou directement sur
[openrouteservice.org](https://openrouteservice.org/dev/#/signup)). La clé
est saisie dans l'app et reste en `localStorage`, jamais commitée dans le repo.

## Scripts

```bash
npm run dev       # serveur de dev
npm run build     # typecheck (tsc -b) + build de prod (génère aussi le service worker)
npm run preview   # sert le build de prod en local
npm run lint       # oxlint
```

## Structure

```
src/
  components/
    SettingsForm.tsx   # écran paramètres : objectif, domicile, section "Avancé" repliable
                        # (taille + clé ORS masquée type mot de passe)
    StepsForm.tsx        # écran principal : anneau de progression, pas faits / objectif
    RouteMap.tsx          # carte + tracé, "Régénérer", bouton "Démarrer" -> Google Maps piéton
    StepRing.tsx            # anneau SVG de progression
    icons.tsx                # set d'icônes SVG maison (pas d'emoji)
  hooks/
    useLocalStorage.ts  # miroir d'un state React <-> localStorage
    useGeolocation.ts    # capture ponctuelle de la position (bouton "Me localiser")
  lib/
    stepLength.ts        # taille -> longueur de pas -> conversions pas/mètres
    orsClient.ts          # appel openrouteservice + correction d'écart (voir CLAUDE.md)
    googleMaps.ts           # construit l'URL Google Maps piéton depuis le tracé généré
    leafletIcons.ts          # fix des icônes Leaflet par défaut sous Vite
  types.ts                 # Settings, RouteResult
  App.tsx                  # état global (settings, écran actif, trajet généré)
```

Direction visuelle façon Apple Santé / Google Fit (voir `CLAUDE.md`, section
Design). openrouteservice approxime parfois largement la distance demandée
pour une boucle : la génération corrige ça automatiquement en ajustant et en
retentant (jusqu'à 3 fois), la distance et le nombre de pas réels affichés
restent toujours ceux réellement obtenus.

Voir [PRD.md](./PRD.md) pour la formule de longueur de pas, le détail des
écrans et la roadmap V2 (fallback hors-ligne, historique, export GPX, calories).
