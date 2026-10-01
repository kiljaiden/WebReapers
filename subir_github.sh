#!/usr/bin/env bash
# ☠️ ETERNAL REAPERS — sube el proyecto a GitHub en un solo paso.
# Uso:  bash subir_github.sh  tu-usuario  tu-repo  [rama]     (rama por defecto: main)
# Necesitas la GitHub CLI (https://cli.github.com) iniciada con `gh auth login`,
# o bien reemplazar la URL por una con token:  https://TOKEN@github.com/USUARIO/REPO.git
set -euo pipefail

USER="${1:?Usa: bash subir_github.sh TU_USUARIO TU_REPO [rama]}"
REPO="${2:?Falta el nombre del repositorio}"
BRANCH="${3:-main}"

cd "$(dirname "$0")"

echo "→ Preparando commit final..."
git add -A
git commit -m "🌾 Cosecha eterna: ETERNAL REAPERS v2.0 (Python/Flask)" --allow-empty -q || true
git branch -M "$BRANCH"

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "→ Añadiendo remoto origin..."
  git remote add origin "https://github.com/${USER}/${REPO}.git"
fi

echo "→ Subiendo rama '$BRANCH' a github.com/${USER}/${REPO} ..."
git push -u origin "$BRANCH" --force

echo ""
echo "✅ Listo. Si el repo no existía, créalo antes en:"
echo "   https://github.com/new  (usuario: $USER, nombre: $REPO, SIN README para evitar conflictos)"
echo ""
echo "Alternativa con GitHub CLI (crea el repo y sube en un comando):"
echo "   gh repo create $USER/$REPO --public --source=. --push"
