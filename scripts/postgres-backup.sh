#!/usr/bin/env bash
set -euo pipefail

# Minimal Postgres backup script for single-droplet setups.
# Usage:
#   DATABASE_URL=... bash scripts/postgres-backup.sh
#
# Optional:
#   BACKUP_DIR=/var/backups/questboard-postgres
#   KEEP_DAYS=14

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-/var/backups/questboard-postgres}"
KEEP_DAYS="${KEEP_DAYS:-14}"
TS="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${BACKUP_DIR}/questboard-${TS}.sql.gz"

mkdir -p "${BACKUP_DIR}"

pg_dump "${DATABASE_URL}" | gzip -9 >"${OUT}"
chmod 600 "${OUT}"

find "${BACKUP_DIR}" -type f -name 'questboard-*.sql.gz' -mtime "+${KEEP_DAYS}" -delete

echo "Backup written: ${OUT}"
