#!/usr/bin/env bash
set -euo pipefail

HOST="${NZNT_VPS_HOST:-136.243.8.214}"
USER="${NZNT_VPS_USER:-deploy}"
KEY="${NZNT_VPS_KEY:-$HOME/.ssh/nznt_vps_ed25519}"
REMOTE_ROOT="${NZNT_REMOTE_ROOT:-/opt/nznt}"
LOCAL_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

SSH=(ssh -i "$KEY" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new "$USER@$HOST")
RSYNC=(rsync -az --delete -e "ssh -i $KEY -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new")

"${SSH[@]}" "mkdir -p '$REMOTE_ROOT'"

"${RSYNC[@]}" \
  --exclude node_modules \
  --exclude dist \
  --exclude .env \
  --exclude storage \
  "$LOCAL_ROOT/nznt-platform/" "$USER@$HOST:$REMOTE_ROOT/nznt-platform/"

"${RSYNC[@]}" \
  --exclude .git \
  --exclude node_modules \
  "$LOCAL_ROOT/Prometheus-master/" "$USER@$HOST:$REMOTE_ROOT/Prometheus-master/"

"${SSH[@]}" "cd '$REMOTE_ROOT/nznt-platform' && docker compose -f docker-compose.prod.yml up -d --build && docker compose -f docker-compose.prod.yml exec -T api pnpm db:deploy && docker compose -f docker-compose.prod.yml ps"
