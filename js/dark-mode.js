/**
 * UIKit Theme Toggle — bascule de scheme (light/dark) consciente de la matrice.
 *
 * Le mode est porté par l'axe SCHEME (attribut `data-scheme`), orthogonal à
 * l'axe THEME (`data-theme` = marque). Ce composant ne pilote que le scheme.
 *
 * Matrice creuse (ADR-0002) : chaque thème déclare ses schemes via la custom
 * property `--supported-schemes`. Le toggle la LIT sur le thème actif et :
 *   · 2 schemes supportés → visible, bascule entre eux ;
 *   · 1 seul → masqué ([hidden]) et scheme FORCÉ sur le seul supporté.
 * AUCUN fallback silencieux, AUCUN dark auto-généré : sur un thème light-only
 * (CoE) le toggle disparaît plutôt que de basculer vers une case indéfinie.
 *
 * La préférence utilisateur (light/dark) persiste en localStorage et reste
 * intacte même quand un thème la force temporairement : revenir sur un thème
 * qui supporte la préférence la restaure. Tout est réévalué À CHAUD quand
 * `data-theme` change (MutationObserver) — le toggle réapparaît/disparaît seul.
 *
 * API publique inchangée (window.UIKitTheme : set/toggle/get) + event
 * `themechange` ; hooks `data-theme-toggle` / `data-theme-icon` conservés.
 */

(function() {
    'use strict';

    const STORAGE_KEY = 'uikit-theme';
    const SCHEME_ATTR = 'data-scheme';
    const THEME_ATTR = 'data-theme';
    const root = document.documentElement;

    // Schemes retenus quand `--supported-schemes` est illisible (CSS pas encore
    // parsé au premier run, ou app épinglée sur un vieux dist/). Ce n'est NI un
    // dark auto-généré NI un fallback vers une case indéfinie : c'est le
    // comportement legacy light+dark de uikit-default, seul thème susceptible
    // de ne pas exposer le manifeste.
    const DEFAULT_SCHEMES = ['light', 'dark'];

    // Lit les schemes supportés par le thème ACTIF depuis le manifeste CSS.
    function getSupportedSchemes() {
        const raw = getComputedStyle(root).getPropertyValue('--supported-schemes');
        const schemes = raw.trim().split(/\s+/).filter(Boolean);
        return schemes.length ? schemes : DEFAULT_SCHEMES.slice();
    }

    function getStoredPreference() {
        return localStorage.getItem(STORAGE_KEY);
    }

    // Préférence utilisateur : choix stocké, sinon préférence système, sinon clair.
    function getPreference() {
        const stored = getStoredPreference();
        if (stored) {
            return stored;
        }
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    // Scheme EFFECTIF = préférence bornée aux schemes supportés par le thème
    // actif. Préférence non supportée (ex. dark sur CoE) → on force le premier
    // scheme supporté SANS écraser la préférence stockée.
    function effectiveScheme(supported, preference) {
        return supported.includes(preference) ? preference : supported[0];
    }

    // (Ré)applique le scheme effectif + ajuste tous les toggles + notifie.
    // Idempotent et réentrant : sûr à appeler à chaque changement de marque.
    function reconcile() {
        const supported = getSupportedSchemes();
        const applied = effectiveScheme(supported, getPreference());

        root.setAttribute(SCHEME_ATTR, applied);
        updateToggles(supported, applied);

        window.dispatchEvent(new CustomEvent('themechange', {
            detail: { theme: applied, scheme: applied, supportedSchemes: supported.slice() }
        }));
        return applied;
    }

    // Visibilité + icône de chaque toggle présent dans le DOM.
    function updateToggles(supported, applied) {
        const single = supported.length <= 1;
        document.querySelectorAll('[data-theme-toggle]').forEach(toggle => {
            toggle.hidden = single;                 // masqué si un seul scheme
            if (single) {
                toggle.setAttribute('aria-hidden', 'true');
            } else {
                toggle.removeAttribute('aria-hidden');
            }

            const icon = toggle.querySelector('[data-theme-icon]');
            if (!icon) {
                return;
            }
            icon.textContent = '';                  // purge l'éventuel emoji legacy
            const showSun = applied === 'dark';     // en sombre → on propose le clair
            icon.classList.toggle('icon-sun', showSun);
            icon.classList.toggle('icon-moon', !showSun);
        });
    }

    // Enregistre une préférence explicite (clic) puis réconcilie.
    function setTheme(scheme) {
        localStorage.setItem(STORAGE_KEY, scheme);
        return reconcile();
    }

    // Bascule vers le scheme supporté suivant. No-op si un seul scheme supporté.
    function toggleTheme() {
        const supported = getSupportedSchemes();
        if (supported.length <= 1) {
            return root.getAttribute(SCHEME_ATTR);
        }
        const current = root.getAttribute(SCHEME_ATTR) || effectiveScheme(supported, getPreference());
        const idx = supported.indexOf(current);
        const next = supported[(idx + 1) % supported.length];
        return setTheme(next);
    }

    // Scheme actuellement appliqué.
    function getCurrentTheme() {
        return root.getAttribute(SCHEME_ATTR) || 'light';
    }

    // Application immédiate pour éviter le flash (toggles pas encore dans le DOM).
    reconcile();

    // Suit les préférences système tant que l'utilisateur n'a rien choisi.
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (!getStoredPreference()) {
                reconcile();
            }
        });
    }

    // Réagit À CHAUD au changement de marque : le manifeste de schemes peut
    // changer → le toggle (ré)apparaît / disparaît / force le scheme.
    if (window.MutationObserver) {
        new MutationObserver(reconcile).observe(root, {
            attributes: true,
            attributeFilter: [THEME_ATTR]
        });
    }

    // API publique
    window.UIKitTheme = {
        set: setTheme,
        toggle: toggleTheme,
        get: getCurrentTheme,
        refresh: reconcile,
        getSupportedSchemes: getSupportedSchemes,
        STORAGE_KEY: STORAGE_KEY
    };

    // Binding des toggles au chargement du DOM (+ sync initial une fois le CSS
    // garanti parsé, donc `--supported-schemes` lisible).
    document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('[data-theme-toggle]').forEach(toggle => {
            toggle.addEventListener('click', toggleTheme);
        });
        reconcile();
    });
})();
