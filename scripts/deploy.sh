#!/usr/bin/env bash
set -euo pipefail

# Simple server deploy script for a single-droplet setup.
# Run on the server, inside the repo:
#   bash scripts/deploy.sh
#
# Optional:
#   APP_NAME=questboard

APP_NAME="${APP_NAME:-questboard}"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "${REPO_DIR}"

echo "[1/4] Pull latest main"
git fetch origin
git checkout main
git pull --ff-only origin main

echo "[2/4] Install dependencies"
npm ci

echo "[3/4] Build"
npm run build

echo "[4/4] Restart app with PM2"
if pm2 describe "${APP_NAME}" >/dev/null 2>&1; then
  pm2 restart "${APP_NAME}" --update-env
else
  pm2 start npm --name "${APP_NAME}" -- start
fi

pm2 save

echo "Deploy complete."
pm2 status "${APP_NAME}" || true
