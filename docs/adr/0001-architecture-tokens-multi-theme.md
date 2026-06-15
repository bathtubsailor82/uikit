# 0001 — Architecture de tokens multi-thème : contrat sémantique 3-tiers

On veut thémer uikit — notamment pour porter l'identité visuelle du Conseil de
l'Europe (CoE) — sans coupler les composants à une marque. **Décision** :
adopter une architecture de design tokens en **3 tiers** — *primitives*
(échelles numériques, propres à chaque thème) → *contrat sémantique* stable et
agnostique (le seul que les composants consomment) → *mapping thème × scheme*
(câble le contrat sur les primitives) — en **conservant le nommage
catégorie-préfixé existant** (`--color-*`, `--space-*`, `--radius-*`,
`--text-*`).

## Status

`accepted` — 2026-06-15

## Considered options

- **Adopter les noms CoE comme contrat** (`--text-primary`, `--action-*`) —
  rejeté : les noms d'un thème ne doivent pas dicter le contrat, et ça impose un
  renommage de toute la consommation composants pour zéro gain.
- **Namespace neuf `--ui-*`** — rejeté : refonte de nommage, churn maximal,
  aucun bénéfice.
- **Figer le contrat à la granularité grossière actuelle** — rejeté : aplatit
  les distinctions fines de CoE (forms/actions) → rendu approximatif, infidèle à
  une charte officielle.
- **Retenu : nommage catégorie-préfixé conservé + structure 3-tiers + contrat
  "superset discipliné"** — le contrat est un set curé, vivant, qui grandit
  *seulement quand un thème prouve une distinction nécessaire* (les `--form-*` /
  `--action-*` CoE entrent au cas par cas), jamais spéculativement.

## Portée (ce qu'un thème a le droit de contrôler)

- **Inclus** : couleur, typographie (famille + échelle), radius.
- **Réservé** : le spacing est un **tier futur** — la structure prévoit sa place,
  mais on ne le construit pas en v1 (aujourd'hui 0 token `--space-*`, ~900 px
  hardcodés ; c'est de la densité structurelle, pas de l'identité de marque).
  L'ajouter plus tard n'impose **aucun rework** des tiers existants.
- **Exclu : toute la partie Audio** (atoms skeuomorphiques `button` / `led` /
  `rotary` / `record-button`, organisme `audio-track`). Esthétique pro-audio
  figée dans le fond et une partie de la forme, consommée par les apps audio
  existantes. Les rendre thémables est overkill → **réflexion séparée
  ultérieure**, hors périmètre. Restent en `uikit-default`.

## Consequences

- Refacto à prévoir : extraire un tier de **primitives** (échelles numériques)
  des valeurs aujourd'hui inlinées en hex dans `:root` ; assainir le tier
  sémantique (`--color-primary` est une primitive déguisée en sémantique) ;
  **créer `--radius-*`** (0 token actuel, `border-radius: Npx` hardcodé partout).
- Le contrat est vivant : ajouter un token sémantique = l'ajouter au contrat
  **et** le fournir dans `uikit-default` (pas seulement dans le thème demandeur).
- CoE est déjà structuré ainsi (échelles `neutral-50…900`, tier sémantique
  `--form-*`/`--action-*`) → son mapping dans le contrat est naturel.
- Sélection thème/scheme : voir ADR-0002.
