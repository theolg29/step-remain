# App "pas restants" — Cahier des charges dev

## Objectif

Une PWA qui calcule, en fonction du nombre de pas déjà faits et d'un objectif quotidien, la distance restante à parcourir, puis génère un trajet piéton réel (vraies rues) en boucle autour du domicile pour couvrir exactement cette distance.

## Stack technique


| Brique          | Choix                                                              | Pourquoi                                                                                                                               |
| --------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend        | Vite + React                                                       | SPA interactive, HMR rapide, écosystème React que tu connais déjà                                                                      |
| PWA             | `vite-plugin-pwa`                                                  | Manifest + service worker + installable, sans effort                                                                                   |
| Carte           | Leaflet + `react-leaflet`                                          | Léger, fonds de carte OSM gratuits                                                                                                     |
| Routing         | openrouteservice (ORS), profil `foot-walking`, option `round_trip` | Génère une vraie boucle piétonne sur les rues, API gratuite, clé perso à créer sur [openrouteservice.org](http://openrouteservice.org) |
| Stockage        | `localStorage`                                                     | Taille, position domicile, clé API ORS, dernier objectif utilisé                                                                       |
| Géolocalisation | `navigator.geolocation` (une fois, à la configuration)             | Capte la position domicile, ajustable ensuite en déplaçant un marker sur la carte                                                      |


Pas de backend. Tout tourne côté client, la clé API ORS reste en local dans le navigateur.

## Formule longueur de pas

```
longueur_pas_cm = taille_cm × 0.415
longueur_pas_m  = longueur_pas_cm / 100

```

Coefficient moyen généralement utilisé pour la marche (approximation, ne dépend que de la taille). Précision suffisante pour ce cas d'usage, pas besoin d'ajuster à l'allure.

## Écrans

### 1. Paramètres (configuration initiale, une fois)

- Taille (cm)
- Position du domicile : capturée via géolocalisation au premier lancement, avec possibilité de déplacer un marker sur la carte pour corriger
- Clé API openrouteservice (champ texte, lien vers la page d'inscription gratuite)
- Objectif de pas par défaut (ex. 10 000, modifiable)

Tout est sauvegardé en `localStorage`.

### 2. Écran principal

**Entrées**

- Pas déjà faits aujourd'hui (input numérique, défaut 0)
- Objectif de pas (pré-rempli avec la valeur par défaut des paramètres, modifiable à la volée)

**Calcul affiché**

- Pas restants = objectif − pas déjà faits
- Distance restante = pas_restants × longueur_pas_m

**Action "Générer un trajet"**

- Appel ORS `directions` (profil `foot-walking`) depuis la position domicile, avec `options.round_trip.length` = distance restante en mètres et `options.round_trip.points` autour de 3 à 5 (forme de la boucle)
- Affichage du tracé sur la carte (Leaflet), avec la distance réelle retournée par ORS (rarement exacte, ORS approxime)
- Recalcul du nombre de pas correspondant à la distance réelle obtenue
- Bouton "Régénérer" : relance l'appel avec un nouveau `seed` pour varier le tracé si celui-ci ne convient pas (rues peu agréables, boucle trop excentrée, etc.)

## Points d'attention

- **Gestion d'erreur réseau** : si l'appel ORS échoue (pas de connexion, clé API invalide, quota dépassé), afficher un message clair. Pas de fallback hors-ligne prévu en V1.
- **Clé API exposée côté client** : c'est un choix assumé pour un outil perso sans backend. Ne pas publier le repo avec la clé en dur, la garder uniquement en `localStorage` saisie par l'utilisateur.
- **Distance jamais exacte** : ORS approxime la boucle demandée, toujours réafficher la distance réelle et le nombre de pas recalculé plutôt que de faire croire que c'est pile la valeur demandée.

## Arborescence suggérée

```
src/
  components/
    SettingsForm.jsx
    StepsForm.jsx
    RouteMap.jsx
  hooks/
    useLocalStorage.js
    useGeolocation.js
  lib/
    stepLength.js       # calcul taille -> longueur de pas
    orsClient.js         # appel API openrouteservice
  App.jsx
  main.jsx
public/
  manifest.webmanifest   # généré par vite-plugin-pwa

```

## Roadmap V2 (pas à faire maintenant)

- Fallback hors-ligne : cercle géométrique via `turf.js` si pas de connexion ou pas de clé API
- Historique des trajets générés
- Export GPX du tracé
- Estimation calorique (nécessiterait de réintroduire le poids)

## Ressources

- openrouteservice, doc directions + round trip : [https://openrouteservice.org/dev/#/api-docs/v2/directions](https://openrouteservice.org/dev/#/api-docs/v2/directions)
- vite-plugin-pwa : [https://vite-pwa-org.netlify.app/](https://vite-pwa-org.netlify.app/)
- react-leaflet : [https://react-leaflet.js.org/](https://react-leaflet.js.org/)

