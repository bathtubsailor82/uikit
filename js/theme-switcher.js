/**
 * UIKit Brand Switcher — sélection du THÈME (axe marque).
 *
 * Complément du scheme toggle (js/dark-mode.js, axe mode). Les deux axes sont
 * ORTHOGONAUX : ce composant ne pilote que `data-theme` (la marque), jamais
 * `data-scheme` (light/dark). Changer de marque déclenche À CHAUD le
 * MutationObserver de dark-mode.js, qui relit `--supported-schemes` du nouveau
 * thème et réajuste / réaffiche le scheme toggle — zéro couplage entre les deux.
 *
 * Convention d'attribut : uikit-default = ABSENCE de `data-theme` (cellule
 * :root). Les autres marques posent `data-theme="<id>"`. La préférence persiste
 * en localStorage (clé séparée de celle du scheme).
 *
 * Registre des marques : éditer BRANDS, ou appeler UIKitBrand.register(id,label)
 * pour en ajouter une à chaud — le toggle se repeuple seul. « Inventer » une
 * marque plus tard = ajouter son bloc de mapping en CSS + une entrée ici.
 *
 * Markup piloté (l'un ou l'autre, repeuplés automatiquement) :
 *   <select data-brand-switch></select>                       (dropdown)
 *   <div data-brand-toggle>                                   (segmented)
 *     <button data-brand-option="uikit-default">…</button> … (généré si vide)
 *   </div>
 *
 * API publique : window.UIKitBrand (set / get / getBrands / register / refresh).
 * Event `brandchange` ({ brand }) émis à chaque application.
 */

(function () {
    'use strict';

    const STORAGE_KEY = 'uikit-brand';
    const THEME_ATTR = 'data-theme';
    const DEFAULT_BRAND = 'uikit-default';
    const root = document.documentElement;

    // Registre des marques connues. Ordre = ordre d'affichage dans les controls.
    const BRANDS = [
        { id: 'uikit-default', label: 'UIKit Default' },
        { id: 'europa-1', label: 'Europa-1' }
    ];

    function getBrands() {
        return BRANDS.map(b => ({ id: b.id, label: b.label }));
    }

    function registerBrand(id, label) {
        if (!id || BRANDS.some(b => b.id === id)) {
            return getBrands();
        }
        BRANDS.push({ id: id, label: label || id });
        populateControls();
        updateControls(getCurrentBrand());
        return getBrands();
    }

    function getStored() {
        return localStorage.getItem(STORAGE_KEY);
    }

    // Marque effective : attribut DOM posé en dur > préférence stockée > défaut.
    function getCurrentBrand() {
        return root.getAttribute(THEME_ATTR) || getStored() || DEFAULT_BRAND;
    }

    function isKnown(brand) {
        return BRANDS.some(b => b.id === brand);
    }

    // (Ré)applique la marque au <html> + sync les controls + notifie.
    function apply(brand) {
        const next = isKnown(brand) ? brand : DEFAULT_BRAND;
        if (next === DEFAULT_BRAND) {
            root.removeAttribute(THEME_ATTR);   // cellule :root, pas d'attribut
        } else {
            root.setAttribute(THEME_ATTR, next);
        }
        updateControls(next);
        window.dispatchEvent(new CustomEvent('brandchange', { detail: { brand: next } }));
        return next;
    }

    // Enregistre une préférence explicite (clic / change) puis applique.
    function setBrand(brand) {
        localStorage.setItem(STORAGE_KEY, brand);
        return apply(brand);
    }

    // Remplit les <select data-brand-switch> vides + génère les boutons segmented
    // vides depuis le registre. Markup déjà fourni à la main → laissé intact.
    function populateControls() {
        document.querySelectorAll('select[data-brand-switch]').forEach(sel => {
            if (sel.options.length) {
                return;
            }
            BRANDS.forEach(b => {
                const opt = document.createElement('option');
                opt.value = b.id;
                opt.textContent = b.label;
                sel.appendChild(opt);
            });
        });
        document.querySelectorAll('[data-brand-toggle]').forEach(group => {
            if (group.querySelector('[data-brand-option]')) {
                return;
            }
            BRANDS.forEach(b => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'segmented-item';
                btn.setAttribute('data-brand-option', b.id);
                btn.textContent = b.label;
                group.appendChild(btn);
            });
        });
    }

    // Reflète la marque active dans tous les controls présents.
    function updateControls(active) {
        document.querySelectorAll('select[data-brand-switch]').forEach(sel => {
            if (sel.value !== active) {
                sel.value = active;
            }
        });
        document.querySelectorAll('[data-brand-option]').forEach(btn => {
            const on = btn.getAttribute('data-brand-option') === active;
            btn.classList.toggle('active', on);
            btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
    }

    // Délégation : un seul listener couvre les controls générés à chaud.
    function onClick(e) {
        const opt = e.target.closest('[data-brand-option]');
        if (opt) {
            setBrand(opt.getAttribute('data-brand-option'));
        }
    }
    function onChange(e) {
        const sel = e.target.closest('select[data-brand-switch]');
        if (sel) {
            setBrand(sel.value);
        }
    }

    // Application immédiate (évite le flash si la préférence diffère du DOM).
    apply(getCurrentBrand());

    document.addEventListener('DOMContentLoaded', function () {
        populateControls();
        apply(getCurrentBrand());
        document.addEventListener('click', onClick);
        document.addEventListener('change', onChange);
    });

    // API publique
    window.UIKitBrand = {
        set: setBrand,
        get: getCurrentBrand,
        getBrands: getBrands,
        register: registerBrand,
        refresh: function () { return apply(getCurrentBrand()); },
        STORAGE_KEY: STORAGE_KEY
    };
})();
