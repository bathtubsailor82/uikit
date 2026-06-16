/**
 * UIKit Dark Mode Toggle
 * Gère le basculement entre light/dark mode avec persistance localStorage.
 *
 * Le mode est porté par l'axe SCHEME (attribut `data-scheme`), orthogonal à
 * l'axe THEME (`data-theme` = marque). Ce toggle ne pilote que le scheme.
 * Le composant theme-toggle dédié (icônes sun/moon, réactif aux schemes
 * supportés du thème actif) est introduit dans une tranche ultérieure ; l'API
 * publique (window.UIKitTheme), l'event `themechange` et les hooks
 * `data-theme-toggle` restent inchangés ici pour ne pas casser les démos.
 */

(function() {
    'use strict';

    const STORAGE_KEY = 'uikit-theme';
    const SCHEME_ATTR = 'data-scheme';

    // Récupère le thème depuis localStorage ou détecte les préférences système
    function getInitialTheme() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return stored;
        }

        // Détection automatique si pas de préférence enregistrée
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }

        return 'light';
    }

    // Applique le thème (= scheme : light/dark)
    function setTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.setAttribute(SCHEME_ATTR, 'dark');
        } else {
            document.documentElement.setAttribute(SCHEME_ATTR, 'light');
        }

        localStorage.setItem(STORAGE_KEY, theme);

        // Dispatch custom event pour que d'autres scripts puissent réagir
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    }

    // Bascule entre light et dark
    function toggleTheme() {
        const current = document.documentElement.getAttribute(SCHEME_ATTR);
        const newTheme = current === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        return newTheme;
    }

    // Obtient le thème actuel
    function getCurrentTheme() {
        return document.documentElement.getAttribute(SCHEME_ATTR) || 'light';
    }

    // Initialise le thème au chargement de la page
    function init() {
        const theme = getInitialTheme();
        setTheme(theme);

        // Écoute les changements de préférence système
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                // Seulement si l'utilisateur n'a pas de préférence explicite
                if (!localStorage.getItem(STORAGE_KEY)) {
                    setTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    // Initialisation immédiate pour éviter le flash
    init();

    // API publique
    window.UIKitTheme = {
        set: setTheme,
        toggle: toggleTheme,
        get: getCurrentTheme,
        STORAGE_KEY: STORAGE_KEY
    };

    // Auto-initialisation des toggles au chargement du DOM
    document.addEventListener('DOMContentLoaded', function() {
        // Trouve tous les boutons avec data-theme-toggle
        const toggles = document.querySelectorAll('[data-theme-toggle]');

        toggles.forEach(toggle => {
            toggle.addEventListener('click', function() {
                const newTheme = toggleTheme();

                // Met à jour l'icône si présent
                const icon = this.querySelector('[data-theme-icon]');
                if (icon) {
                    icon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
                }
            });

            // Initialise l'icône
            const icon = toggle.querySelector('[data-theme-icon]');
            if (icon) {
                icon.textContent = getCurrentTheme() === 'dark' ? '☀️' : '🌙';
            }
        });
    });
})();
