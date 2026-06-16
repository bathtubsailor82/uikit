#!/usr/bin/env node
/**
 * Check build-time de complétude du contrat de tokens — zéro dépendance.
 *
 * Parse `dist/uikit.css` et vérifie, pour CHAQUE cellule de la matrice
 * (thème × scheme) déclarée dans `css/token-contract.json`, que CHAQUE token
 * sémantique du contrat résout :
 *   - le token est défini dans la cellule           → sinon "unmapped"
 *   - sa chaîne var() résout vers une valeur finale  → sinon "dangling"/"unresolved"
 *
 * Exit 0 si tout résout, 1 sinon. Branché sur `npm run build` (css/build.sh)
 * pour refuser de livrer un thème incomplet (PRD #1, ADR-0001).
 *
 * La matrice est CREUSE et le check grandit cellule par cellule : ajouter un
 * thème/scheme = ajouter une entrée `matrix` ; ajouter un token = l'ajouter à
 * `contract` ET le mapper dans chaque cellule. Aucune dépendance, aucun runner.
 *
 * Usage :
 *   node scripts/check-token-contract.mjs            # check (exit code)
 *   node scripts/check-token-contract.mjs --print    # + dump valeurs résolues
 */

import { readFileSync } from 'node:fs';

const DIST = new URL('../dist/uikit.css', import.meta.url);
const MANIFEST = new URL('../css/token-contract.json', import.meta.url);
const PRINT = process.argv.includes('--print');

/** Retire les commentaires CSS `/* ... *\/`. */
function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Découpe le CSS en blocs de RÈGLES de PREMIER NIVEAU `{prelude}{body}`.
 * Conscient des chaînes (' "), donc les accolades dans `content:` n'égarent
 * pas le scanner. Ne descend PAS dans les at-rules (`@media …{…}`) : un bloc
 * `:root` imbriqué dans `@media (prefers-color-scheme: dark)` n'est donc pas
 * confondu avec un `:root` de premier niveau — exactement ce qu'on veut pour
 * isoler la cellule `light`.
 */
function topLevelBlocks(css) {
  const blocks = [];
  let depth = 0, segStart = 0, bodyStart = 0, prelude = '';
  let quote = null;
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (quote) {
      if (c === quote && css[i - 1] !== '\\') quote = null;
      continue;
    }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === '{') {
      if (depth === 0) { prelude = css.slice(segStart, i); bodyStart = i + 1; }
      depth++;
    } else if (c === '}') {
      depth--;
      if (depth === 0) {
        blocks.push({ selector: normSelector(prelude), body: css.slice(bodyStart, i) });
        segStart = i + 1;
      }
    } else if (c === ';' && depth === 0) {
      segStart = i + 1; // statement sans bloc (@import …;) → reset prelude
    }
  }
  return blocks;
}

/** Normalise un sélecteur : espaces collapsés, trim. */
function normSelector(s) {
  return s.replace(/\s+/g, ' ').trim();
}

/** Extrait les custom properties `--name: value;` d'un corps de bloc. */
function declarations(body) {
  const out = [];
  const re = /(--[\w-]+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(body)) !== null) out.push([m[1], m[2].trim()]);
  return out;
}

/**
 * Construit la table de résolution d'une cellule : on empile, dans l'ordre,
 * les déclarations de chaque bloc dont le sélecteur figure dans `selectors`
 * (dernier gagnant — cascade source-order à spécificité égale).
 */
function buildScope(blocks, selectors) {
  const scope = Object.create(null);
  for (const sel of selectors) {
    for (const blk of blocks) {
      if (blk.selector !== sel) continue;
      for (const [name, value] of declarations(blk.body)) scope[name] = value;
    }
  }
  return scope;
}

/** Résout un token du contrat dans une scope. */
function resolveToken(token, scope) {
  if (scope[token] === undefined) return { status: 'unmapped' };
  let dangling = null, cycle = null;
  const visiting = new Set();
  const re = /var\(\s*(--[\w-]+)\s*(?:,\s*([^)]*))?\)/g;
  function expand(value, depth) {
    if (depth > 64) { cycle = '<too-deep>'; return value; }
    return value.replace(re, (full, name, fallback) => {
      if (scope[name] !== undefined) {
        if (visiting.has(name)) { cycle = name; return full; }
        visiting.add(name);
        const r = expand(scope[name], depth + 1);
        visiting.delete(name);
        return r;
      }
      if (fallback !== undefined) return expand(fallback, depth + 1);
      dangling = name;
      return full;
    });
  }
  const value = expand(scope[token], 0).trim();
  if (cycle) return { status: 'cycle', ref: cycle, value };
  if (dangling) return { status: 'dangling', ref: dangling, value };
  if (/var\(/.test(value)) return { status: 'unresolved', value };
  return { status: 'ok', value };
}

// ---------------------------------------------------------------------------

function main() {
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const css = stripComments(readFileSync(DIST, 'utf8'));
  const blocks = topLevelBlocks(css);

  let failures = 0;
  for (const cell of manifest.matrix) {
    const label = `${cell.theme} × ${cell.scheme}`;
    const scope = buildScope(blocks, cell.selectors);
    const tokens = (cell.categories || Object.keys(manifest.contract))
      .flatMap((cat) => manifest.contract[cat] || []);

    const problems = [];
    const resolved = [];
    for (const token of tokens) {
      const r = resolveToken(token, scope);
      if (r.status === 'ok') resolved.push([token, r.value]);
      else problems.push({ token, ...r });
    }

    if (problems.length === 0) {
      console.log(`✓ ${label} : ${resolved.length}/${tokens.length} tokens du contrat résolus`);
    } else {
      failures += problems.length;
      console.error(`✗ ${label} : ${problems.length}/${tokens.length} token(s) NON résolu(s) :`);
      for (const p of problems) {
        const detail =
          p.status === 'unmapped' ? 'non mappé par ce thème'
          : p.status === 'dangling' ? `var(${p.ref}) pendant (référence inconnue)`
          : p.status === 'cycle' ? `cycle de var() sur ${p.ref}`
          : `non résolu (reste un var()) → ${p.value}`;
        console.error(`    ${p.token} — ${detail}`);
      }
    }

    if (PRINT) {
      for (const [token, value] of resolved) console.log(`    ${token} = ${value}`);
    }
  }

  if (failures > 0) {
    console.error(`\nContrat de tokens INCOMPLET : ${failures} échec(s). Build refusé.`);
    process.exit(1);
  }
  console.log('Contrat de tokens complet sur toute la matrice.');
}

main();
