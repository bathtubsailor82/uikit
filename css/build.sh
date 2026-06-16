#!/bin/bash
# Build script pour dist/uikit.css

echo "Building dist/uikit.css..."

# Créer fichier temporaire
TMP_FILE="dist/uikit.css.tmp"
> "$TMP_FILE"

# Liste des fichiers dans l'ordre (extrait de uikit.css)
FILES=(
  "css/tokens.css"
  "css/reset.css"
  "css/accessibility.css"
  "css/layout.css"
  "css/layouts.css"
  "css/components/buttons.css"
  "css/components/forms.css"
  "css/components/icons.css"
  "css/components/header.css"
  "css/components/tabs.css"
  "css/components/breadcrumb.css"
  "css/components/pagination.css"
  "css/components/tables.css"
  "css/components/cards.css"
  "css/components/list-items.css"
  "css/components/badges.css"
  "css/components/avatar.css"
  "css/components/stats.css"
  "css/components/alerts.css"
  "css/components/notifications.css"
  "css/components/modals.css"
  "css/components/loading.css"
  "css/components/progress.css"
  "css/components/logs.css"
  "css/components/range.css"
  "css/components/number-input.css"
  "css/components/tags.css"
  "css/components/file-input.css"
  "css/components/accordion.css"
  "css/components/dropdown.css"
  "css/components/tooltip.css"
  "css/components/popover.css"
  "css/components/segmented.css"
  "css/components/theme-toggle.css"
  "css/components/divider.css"
  "css/components/empty-state.css"
  "css/components/stepper.css"
  "css/components/timeline.css"
  "css/components/matrix.css"
  "css/components/time-picker.css"
  "css/components/atoms/button.css"
  "css/components/atoms/led.css"
  "css/components/atoms/rotary.css"
  "css/components/atoms/record-button.css"
  "css/components/atoms/timer.css"
  "css/components/atoms/color-picker.css"
  "css/components/molecules/button-group.css"
  "css/components/molecules/record-control.css"
  "css/components/organisms/audio-track.css"
)

# Concaténer fichiers
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "/* === $file === */" >> "$TMP_FILE"
    cat "$file" >> "$TMP_FILE"
    echo "" >> "$TMP_FILE"
  else
    echo "Warning: $file not found"
  fi
done

# Remplacer le fichier final
mv "$TMP_FILE" "dist/uikit.css"

echo "Done! $(wc -l < dist/uikit.css) lines generated"

# Check build-time : le contrat de tokens doit résoudre entièrement.
# Refuse de livrer un dist/ où un token du contrat est non mappé ou pendant.
echo "Checking token contract..."
if ! node scripts/check-token-contract.mjs; then
  echo "✗ Build refusé : contrat de tokens incomplet (voir ci-dessus)."
  exit 1
fi
