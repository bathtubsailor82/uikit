# 0002 — Sélection thème & scheme : deux attributs orthogonaux

Le multi-thème introduit **deux axes** : la *marque* (theme) et le *mode*
(scheme, light/dark). uikit utilise aujourd'hui `data-theme="dark"` pour le
**mode**. **Décision** : séparer les axes en deux attributs distincts —
`data-theme` = marque, `data-scheme` = mode — et migrer l'usage actuel
(`data-theme="dark"` → `data-scheme="dark"`) par **codemod mécanique**.

## Status

`accepted` — 2026-06-15

## Considered options

- **Additif** : garder `data-theme` = mode et ajouter `data-brand` = marque —
  rejeté. Zéro casse, mais perpétue la surcharge legacy ; les design systems
  matures (GitHub Primer, Radix) *séparent* les axes et ne surchargent jamais un
  seul attribut. Choisi seulement si on minimisait la casse — contrainte que
  l'on a relâchée (refacto durable assumée).
- **Attribut combiné** `data-theme="coe-dark"` — rejeté : combinatoire,
  sélecteurs CSS lourds, axes non variables indépendamment.
- **Retenu** : `data-theme` (marque) + `data-scheme` (mode), via codemod.
  Aligné sur la convention des DS matures (Primer `data-color-mode` + thème ;
  Radix `appearance` + `accentColor`).

## Matrice creuse & manifeste de schemes

- La matrice **thème × scheme** est **creuse** : un thème peut ne fournir qu'un
  sous-ensemble des schemes. Chaque thème **déclare ses schemes supportés** via
  une custom property `--supported-schemes` (lue par le toggle). CoE = `light`
  uniquement.
- **Case vide** → l'UI s'adapte : le toggle de scheme est masqué/forcé quand le
  thème actif ne supporte pas les deux. **Jamais** de rendu de case indéfinie,
  **pas** de fallback silencieux (le toggle mentirait), **pas** de dark
  auto-généré (hors-charte sur une identité officielle).
- « Inventer » un scheme plus tard (ex. CoE dark) = ajouter le bloc de mapping
  **et** ajouter le scheme à `--supported-schemes` → le toggle réapparaît, zéro
  refonte.

## Consequences

- **Migration coordonnée uikit + apps** (MR3, nabu-connector) : rename mécanique
  `[data-theme="dark"]` → `[data-scheme="dark"]` (dizaines de sélecteurs internes
  : `number-input`, `logs`, `alerts`, `matrix`, `empty-state`, `stepper`… +
  les `test-*.html` + le toggle dans `dark-mode.js` + le fallback
  `@media (prefers-color-scheme)`).
- **Release coordonnée** : une app qui épingle l'ancien uikit avec le nouveau
  markup aurait des attributs désynchronisés. Risque géré par l'ordre de commit
  imposé (UIKit submodule **avant** l'app parente).
- Contrat de tokens consommé par cette sélection : voir ADR-0001.
