#!/usr/bin/env bash
# check-staleness.sh
# Checks which AGENTS.md files may be stale compared to their project's source files.
# Also checks for projects missing AGENTS.md entirely.
# Usage: .claude/skills/knowledge-sync/scripts/check-staleness.sh [--verbose]
#
# Exit codes:
#   0 — everything up-to-date
#   1 — stale or missing docs found (action needed)

set -euo pipefail

REPO_ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
VERBOSE="${1:-}"
STALE=0

cd "$REPO_ROOT"

# ─── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Knowledge Staleness Check — Nuclia Frontend Monorepo  ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# ─── 1. Check for missing AGENTS.md ───────────────────────────────────────────
echo -e "${BLUE}[1/3] Checking for missing AGENTS.md files...${NC}"
MISSING=()

for dir in apps/*/ libs/*/; do
  # Skip dirs that are just build artifacts or don't have a project.json
  [ ! -f "${dir}project.json" ] && continue
  if [ ! -f "${dir}AGENTS.md" ]; then
    MISSING+=("$dir")
  fi
done

if [ ${#MISSING[@]} -eq 0 ]; then
  echo -e "  ${GREEN}✓ All projects have AGENTS.md${NC}"
else
  echo -e "  ${RED}✗ Missing AGENTS.md (CRITICAL — create these first):${NC}"
  for f in "${MISSING[@]}"; do
    echo -e "    ${RED}→ ${f}AGENTS.md${NC}"
  done
  STALE=1
fi
echo ""

# ─── 2. Check for stale AGENTS.md (source newer than doc) ─────────────────────
echo -e "${BLUE}[2/3] Checking for stale AGENTS.md files...${NC}"
STALE_FILES=()

for dir in apps/*/ libs/*/; do
  [ ! -f "${dir}project.json" ] && continue
  agents_md="${dir}AGENTS.md"
  [ ! -f "$agents_md" ] && continue  # already flagged above

  # Find any .ts, .html, .scss file in src/ newer than AGENTS.md
  newer_count=$(find "${dir}src" -newer "$agents_md" \( -name "*.ts" -o -name "*.html" -o -name "*.scss" \) 2>/dev/null | wc -l | tr -d ' ')

  if [ "$newer_count" -gt 0 ]; then
    STALE_FILES+=("$dir ($newer_count source files newer)")
    if [ "$VERBOSE" = "--verbose" ]; then
      echo -e "  ${YELLOW}⚠  ${dir}AGENTS.md — ${newer_count} newer source files:${NC}"
      find "${dir}src" -newer "$agents_md" \( -name "*.ts" -o -name "*.html" -o -name "*.scss" \) 2>/dev/null | head -5 | sed 's/^/       /'
    fi
  fi
done

if [ ${#STALE_FILES[@]} -eq 0 ]; then
  echo -e "  ${GREEN}✓ All AGENTS.md files appear up-to-date${NC}"
else
  echo -e "  ${YELLOW}⚠  Potentially stale AGENTS.md files:${NC}"
  for f in "${STALE_FILES[@]}"; do
    echo -e "    ${YELLOW}→ ${f}${NC}"
  done
  STALE=1
fi
echo ""

# ─── 3. Check for recent commits that touched source but not docs ──────────────
echo -e "${BLUE}[3/3] Checking recent commits (last 7 days) for un-synced changes...${NC}"

# Get commits from last 7 days
recent_commits=$(git log --since="7 days ago" --oneline 2>/dev/null | head -10)

if [ -z "$recent_commits" ]; then
  echo -e "  ${GREEN}✓ No commits in the last 7 days${NC}"
else
  # Find projects touched by recent commits but whose AGENTS.md wasn't touched
  touched_projects=$(git log --since="7 days ago" --name-only --pretty=format: 2>/dev/null \
    | grep "^apps/\|^libs/" \
    | awk -F'/' '{print $1"/"$2}' \
    | sort -u)

  unsynced=()
  while IFS= read -r project; do
    [ -z "$project" ] && continue
    agents_path="${project}/AGENTS.md"
    [ ! -f "$agents_path" ] && continue  # already flagged

    # Check if AGENTS.md was itself touched in recent commits
    agents_touched=$(git log --since="7 days ago" -- "$agents_path" 2>/dev/null | wc -l | tr -d ' ')
    source_touched=$(git log --since="7 days ago" -- "${project}/src" 2>/dev/null | wc -l | tr -d ' ')

    if [ "$source_touched" -gt 0 ] && [ "$agents_touched" -eq 0 ]; then
      last_commit_msg=$(git log --since="7 days ago" --oneline -- "${project}/src" 2>/dev/null | head -1)
      unsynced+=("$project — last: $last_commit_msg")
    fi
  done <<< "$touched_projects"

  if [ ${#unsynced[@]} -eq 0 ]; then
    echo -e "  ${GREEN}✓ No un-synced source changes in last 7 days${NC}"
  else
    echo -e "  ${YELLOW}⚠  Source changed without updating AGENTS.md (last 7 days):${NC}"
    for f in "${unsynced[@]}"; do
      echo -e "    ${YELLOW}→ ${f}${NC}"
    done
    STALE=1
  fi
fi
echo ""

# ─── Summary ──────────────────────────────────────────────────────────────────
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
if [ "$STALE" -eq 0 ]; then
  echo -e "${GREEN}  ✓ Knowledge is up-to-date. Nothing to sync.${NC}"
else
  echo -e "${YELLOW}  ⚠  Action needed. Ask Claude:${NC}"
  echo -e "     \"Run knowledge sync for the current branch diff\""
  echo -e "     or: \"Run knowledge sync for commit <hash>\""
fi
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

exit $STALE
