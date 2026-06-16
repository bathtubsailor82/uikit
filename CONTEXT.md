# UIKit - Design System MR3

Glossaire de domaine : le vocabulaire partagé entre développeurs et agents.
Peuplé au fil des décisions résolues — **ne pas remplir en masse**. C'est un
glossaire, pas une spec : aucun détail d'implémentation ici (ça vit dans
`docs/adr/`).

## Language

**Theme** (axe *marque*) :
L'identité visuelle nommée qui fournit un jeu complet de valeurs de design — p.ex. `uikit-default`, `europa-1`. Sélectionne *quelles* valeurs.
_Avoid_: scheme, mode, skin

**Scheme** (axe *mode*) :
L'ambiance claire ou sombre d'un thème. Sélectionne la luminosité, indépendamment du thème.
_Avoid_: theme, brand

**Primitive** (token primitif) :
Une valeur brute de la palette d'un thème (couleur, espacement, rayon, taille). Spécifique au thème, jamais consommée directement par un composant.
_Avoid_: semantic token, alias

**Semantic token** (token sémantique) :
Un nom stable et agnostique au thème, consommé par les composants (p.ex. « la couleur du texte principal »). Sa valeur est résolue par le thème actif.
_Avoid_: primitive, raw value

**Contract** (contrat de tokens) :
L'ensemble figé des tokens sémantiques — l'API entre les thèmes et les composants. Un thème *implémente* le contrat ; un composant *consomme* le contrat.
_Avoid_: theme, palette

**Matrix** (matrice thème × scheme) :
L'ensemble des combinaisons (thème × scheme) disponibles. Elle est *creuse* : un thème peut ne fournir qu'un sous-ensemble des schemes (p.ex. Europa-1 = clair seulement).
_Avoid_: grid

## Relationships

- Un **Theme** fournit un ou plusieurs **Schemes** (matrice creuse).
- Un **Theme** apporte ses propres **Primitives**.
- Chaque case (**Theme** × **Scheme**) résout le **Contract** : elle câble chaque **Semantic token** sur une **Primitive** du thème.
- Un composant consomme uniquement des **Semantic tokens**, jamais une **Primitive**.

## Flagged ambiguities

- « theme » était surchargé : il désignait à la fois l'identité de marque **et** le mode clair/sombre. Résolu : **Theme** = axe marque, **Scheme** = axe mode — deux concepts distincts et orthogonaux.
- « token » sans qualificatif est ambigu : préciser **Primitive** (valeur brute, par thème) ou **Semantic token** (nom stable du contrat).
