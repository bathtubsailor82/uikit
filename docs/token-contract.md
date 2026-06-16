# Contrat de tokens sémantiques

> Source de vérité machine : [`css/token-contract.json`](../css/token-contract.json).
> Vérifié au build par [`scripts/check-token-contract.mjs`](../scripts/check-token-contract.mjs).
> Décisions : [ADR-0001](adr/0001-architecture-tokens-multi-theme.md), glossaire [CONTEXT.md](../CONTEXT.md).

Le **contrat** est l'API stable entre les thèmes et les composants. Un composant
**consomme** uniquement des tokens du contrat (jamais une primitive) ; un thème
**implémente** le contrat en câblant chaque token sur une de ses primitives.

Architecture en 3 tiers (voir `css/tokens.css`) :

1. **Primitives** — échelles brutes, propres à chaque thème (`--color-neutral-*`,
   `--color-blue-*`, familles `--font-sans` / `--font-mono`, tailles `--type-*`,
   …). Jamais consommées directement.
2. **Contract** — les tokens sémantiques listés ci-dessous. Noms catégorie-préfixés
   stables (`--color-*`, `--font-family-*`, `--font-size-*`). C'est ce que les
   composants utilisent.
3. **Mapping** (thème × scheme) — câble chaque token du contrat sur une primitive.
   `uikit-default · light` reproduit le rendu actuel à l'identique.

Le contrat est un **superset discipliné** : il grandit cellule par cellule, sur
besoin démontré (les `--form-*` / `--action-*` de CoE entreront au cas par cas),
**jamais** spéculativement.

## Portée actuelle

- **Couleur** : implémentée. 32 tokens, ci-dessous.
- **Typographie** (famille + échelle) : implémentée. 9 tokens, ci-dessous.
- **Radius** : implémentée. 5 tokens, ci-dessous.
- **Spacing** : tier réservé, hors v1.
- **Audio** (atoms skeuomorphiques + `audio-track`) et **entity colors** : hors
  contrat, non thémables. Les composants Audio gardent leurs polices inlinées.
- Hors contrat aussi (constantes cross-thème, non thémées) : `--font-weight-*`,
  `--line-height-*`.

## Matrice thème × scheme

Le mode est porté par l'axe **scheme** (`data-scheme`), distinct de l'axe
**theme** / marque (`data-theme`) — cf. [ADR-0002](adr/0002-selection-theme-scheme.md).

| Thème           | Scheme  | Statut     | Sélecteur(s)                          |
| --------------- | ------- | ---------- | ------------------------------------- |
| `uikit-default` | `light` | ✅ vérifié | `:root`                               |
| `uikit-default` | `dark`  | ✅ vérifié | `:root`, `[data-scheme="dark"]`       |
| `coe`           | `light` | ✅ vérifié | `:root`, `:root[data-theme="coe"]`    |

Le dark de `uikit-default` est appliqué via `[data-scheme="dark"]` et couvert
par le check sur les deux cellules. Ses valeurs sont pour l'instant littérales
(rendu reproduit à l'identique) ; leur extraction en primitives dark reste
possible plus tard sans rework. La matrice est **creuse** par conception
(ADR-0002) : un thème ne fournit que les schemes qu'il supporte.

**CoE** (`<html data-theme="coe">`) est la première marque non-default : elle
câble les 32 tokens couleur, **les 9 tokens typo et les 5 tokens radius** sur ses
propres primitives (`--coe-*`, échelles de la charte ; typo = **Open Sans** +
échelle Figma DS CoE ; radius = échelle `--coe-radius-*` de la charte, plus
généreuse), sans modifier un seul composant. CoE est **light-only** ; son
sélecteur `:root[data-theme="coe"]` (spécificité 0,2,0) bat volontairement le
fallback `@media (prefers-color-scheme: dark)` pour ne jamais basculer en dark
auto. Le manifeste `--supported-schemes` et l'adaptation du toggle (case
`coe × dark` absente, non silencieuse) relèvent d'une tranche dédiée.

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

## Tokens du contrat — typographie

Famille + échelle de tailles. Les composants consomment ces noms (jamais les
primitives `--font-sans` / `--font-mono` / `--type-*`). `uikit-default` reproduit
la typo actuelle à l'identique ; `coe` les remappe sur Open Sans + l'échelle de
la charte (la taille de corps, `--font-size-lg` du `<body>`, tombe sur le
`paragraph-body` CoE = 15px).

| Token sémantique     | Rôle                          | uikit-default | coe  |
| -------------------- | ----------------------------- | ------------- | ---- |
| `--font-family-base` | Police de base (texte courant) | system-ui     | Open Sans |
| `--font-family-mono` | Police monospace (technique)   | SF Mono       | *(hérité système)* |
| `--font-size-xs`     | Micro (labels, badges)         | 9px           | 12px |
| `--font-size-sm`     | Petit (captions)               | 10px          | 13px |
| `--font-size-base`   | Base                           | 11px          | 13px |
| `--font-size-md`     | Moyen                          | 12px          | 15px |
| `--font-size-lg`     | Corps (défaut `<body>`)        | 13px          | 15px |
| `--font-size-xl`     | Sous-titre                     | 16px          | 20px |
| `--font-size-2xl`    | Titre                          | 18px          | 24px |

> Open Sans est une web font : l'app consommatrice doit la charger (`<link>` /
> `@font-face`). Le stack de repli système assure un rendu dégradé propre.

## Tokens du contrat — radius

Échelle de rayons de coins. Les composants consomment ces noms (jamais les
primitives `--radius-2/3/4/6` d'uikit-default ni `--coe-radius-*` de CoE). Le
radius **ne varie pas selon le scheme** (un seul mapping en `:root`, hérité par
la cellule dark). `uikit-default` reproduit le rendu radius actuel à l'identique
(ex-`--border-radius-*`) ; `coe` remappe sur l'échelle plus généreuse de la
charte.

| Token sémantique | Rôle                            | uikit-default | coe    |
| ---------------- | ------------------------------- | ------------- | ------ |
| `--radius-sm`    | Petit (puces, swatches, inputs) | 2px           | 2px    |
| `--radius-md`    | Moyen (défaut cartes/boutons)   | 3px           | 4px    |
| `--radius-lg`    | Grand (modales, panneaux)       | 4px           | 8px    |
| `--radius-xl`    | Très grand                      | 6px           | 12px   |
| `--radius-full`  | Pilule / fully rounded          | 9999px        | 9999px |

> `--radius-full` est un **sentinel géométrique** (pilule), constante
> cross-thème héritée de `:root` : une pilule reste une pilule quelle que soit la
> marque — au même titre que les cercles `border-radius: 50%`. Le « no-radius »
> reste le littéral `0` dans les composants (square reset, non thémé) → pas de
> token `--radius-none`. Les atoms Audio skeuomorphiques (`button`, `led`,
> `rotary`, `record-button`, `timer`, `audio-track`) gardent leurs rayons inlinés
> (hors contrat, ADR-0001). La charte CoE définit aussi `--coe-radius-xxl` (16px),
> importé comme primitive mais **hors contrat** (aucun composant ne le consomme).

## Faire grandir le contrat

Ajouter un token sémantique =

1. l'ajouter à la liste `contract.color` (ou nouvelle catégorie) dans
   `css/token-contract.json` **et** à ce tableau ;
2. le mapper sur une primitive dans **chaque** cellule de la matrice
   (pas seulement le thème demandeur — sinon le check échoue) ;
3. `npm run build` : le check refuse de livrer un contrat incomplet.
