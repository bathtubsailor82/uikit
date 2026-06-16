# Contrat de tokens sémantiques

> Source de vérité machine : [`css/token-contract.json`](../css/token-contract.json).
> Vérifié au build par [`scripts/check-token-contract.mjs`](../scripts/check-token-contract.mjs).
> Décisions : [ADR-0001](adr/0001-architecture-tokens-multi-theme.md), glossaire [CONTEXT.md](../CONTEXT.md).

Le **contrat** est l'API stable entre les thèmes et les composants. Un composant
**consomme** uniquement des tokens du contrat (jamais une primitive) ; un thème
**implémente** le contrat en câblant chaque token sur une de ses primitives.

Architecture en 3 tiers (voir `css/tokens.css`) :

1. **Primitives** — échelles numériques brutes, propres à chaque thème
   (`--color-neutral-*`, `--color-blue-*`, …). Jamais consommées directement.
2. **Contract** — les tokens sémantiques listés ci-dessous. Noms catégorie-préfixés
   stables (`--color-*`). C'est ce que les composants utilisent.
3. **Mapping** (thème × scheme) — câble chaque token du contrat sur une primitive.
   `uikit-default · light` reproduit le rendu actuel à l'identique.

Le contrat est un **superset discipliné** : il grandit cellule par cellule, sur
besoin démontré (les `--form-*` / `--action-*` de CoE entreront au cas par cas),
**jamais** spéculativement.

## Portée actuelle

- **Couleur** : implémentée (cette tranche). 32 tokens, ci-dessous.
- **Typographie** (famille + échelle), **radius** : prévus, pas encore au contrat.
- **Spacing** : tier réservé, hors v1.
- **Audio** (atoms skeuomorphiques + `audio-track`) et **entity colors** : hors
  contrat, non thémables.

## Matrice thème × scheme

Le mode est porté par l'axe **scheme** (`data-scheme`), distinct de l'axe
**theme** / marque (`data-theme`) — cf. [ADR-0002](adr/0002-selection-theme-scheme.md).

| Thème           | Scheme  | Statut     | Sélecteur(s)                    |
| --------------- | ------- | ---------- | ------------------------------- |
| `uikit-default` | `light` | ✅ vérifié | `:root`                         |
| `uikit-default` | `dark`  | ✅ vérifié | `:root`, `[data-scheme="dark"]` |

Le dark de `uikit-default` est appliqué via `[data-scheme="dark"]` et couvert
par le check sur les deux cellules. Ses valeurs sont pour l'instant littérales
(rendu reproduit à l'identique) ; leur extraction en primitives dark reste
possible plus tard sans rework. La matrice est **creuse** par conception
(ADR-0002) : un thème ne fournit que les schemes qu'il supporte.

## Tokens du contrat — couleur

| Token sémantique         | Rôle                                   |
| ------------------------ | -------------------------------------- |
| `--color-primary`        | Couleur de marque principale           |
| `--color-primary-hover`  | Marque, état survol                     |
| `--color-success`        | Succès / validation                     |
| `--color-success-dark`   | Succès, variante foncée                 |
| `--color-warning`        | Avertissement                           |
| `--color-danger`         | Erreur / danger                         |
| `--color-info`           | Information                             |
| `--color-info-dark`      | Information, variante foncée            |
| `--color-online`         | Statut en ligne                         |
| `--color-offline`        | Statut hors ligne                       |
| `--color-primary-light`  | Fond doux teinté marque                 |
| `--color-success-light`  | Fond doux succès                        |
| `--color-warning-light`  | Fond doux avertissement                 |
| `--color-warning-bg`     | Fond avertissement (variante)           |
| `--color-danger-light`   | Fond doux danger                        |
| `--color-danger-bg`      | Fond danger (variante)                  |
| `--color-info-light`     | Fond doux information                   |
| `--color-bg-primary`     | Surface principale                      |
| `--color-bg-secondary`   | Surface secondaire                      |
| `--color-bg-tertiary`    | Surface tertiaire                       |
| `--color-bg-hover`       | Surface, état survol                    |
| `--color-bg-active`      | Surface, état actif                     |
| `--color-text-primary`   | Texte principal                         |
| `--color-text-secondary` | Texte secondaire                        |
| `--color-text-tertiary`  | Texte tertiaire / atténué               |
| `--color-text-disabled`  | Texte désactivé                         |
| `--color-text-white`     | Texte sur fond foncé / coloré           |
| `--color-border-light`   | Bordure légère                          |
| `--color-border-medium`  | Bordure standard                        |
| `--color-border-dark`    | Bordure marquée                         |
| `--color-dark`           | Surface foncée (composants sombres)     |
| `--color-dark-hover`     | Surface foncée, état survol             |

## Faire grandir le contrat

Ajouter un token sémantique =

1. l'ajouter à la liste `contract.color` (ou nouvelle catégorie) dans
   `css/token-contract.json` **et** à ce tableau ;
2. le mapper sur une primitive dans **chaque** cellule de la matrice
   (pas seulement le thème demandeur — sinon le check échoue) ;
3. `npm run build` : le check refuse de livrer un contrat incomplet.
