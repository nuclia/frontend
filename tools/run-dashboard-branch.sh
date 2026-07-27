#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BRANCH="${1:-$(git -C "$REPO_ROOT" branch --show-current)}"
PORT="${PORT:-4200}"
CONFIG="${CONFIG:-local-stage}"
APP_URL="http://localhost:${PORT}/"

echo "→ Repo: $REPO_ROOT"
echo "→ Branch: $BRANCH"
echo "→ Config: $CONFIG"
echo "→ Port: $PORT"

if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  PID="$(lsof -nP -iTCP:"$PORT" -sTCP:LISTEN | awk 'NR==2 {print $2}')"
  if [[ -n "$PID" ]]; then
    echo "→ Stopping process on port $PORT (PID: $PID)"
    kill "$PID"
  fi
fi

CURRENT_BRANCH="$(git -C "$REPO_ROOT" branch --show-current)"
if [[ "$CURRENT_BRANCH" != "$BRANCH" ]]; then
  echo "→ Switching branch: $CURRENT_BRANCH -> $BRANCH"
  git -C "$REPO_ROOT" checkout "$BRANCH"
fi

echo "→ Opening $APP_URL in Safari"
open -a Safari "$APP_URL"

echo "→ Starting dashboard (this terminal stays attached)"
cd "$REPO_ROOT"
corepack yarn nx serve dashboard -c "$CONFIG" --port="$PORT"
