#!/usr/bin/env bash
# install-hooks.sh
# Installs a post-merge git hook that runs the knowledge staleness check
# after every git pull / git merge.
#
# Usage: .claude/skills/knowledge-sync/scripts/install-hooks.sh
# To uninstall: rm .git/hooks/post-merge

set -euo pipefail

REPO_ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
HOOK_PATH="${REPO_ROOT}/.git/hooks/post-merge"
SCRIPT_PATH="${REPO_ROOT}/.claude/skills/knowledge-sync/scripts/check-staleness.sh"

# Make the check script executable
chmod +x "$SCRIPT_PATH"

cat > "$HOOK_PATH" << 'HOOK'
#!/usr/bin/env bash
# post-merge hook — installed by .claude/skills/knowledge-sync/scripts/install-hooks.sh
# Runs knowledge staleness check after git pull / git merge

REPO_ROOT="$(git rev-parse --show-toplevel)"
SCRIPT="${REPO_ROOT}/.claude/skills/knowledge-sync/scripts/check-staleness.sh"

if [ -x "$SCRIPT" ]; then
  "$SCRIPT" || true  # never block the merge
fi
HOOK

chmod +x "$HOOK_PATH"

echo ""
echo "✓ post-merge hook installed at: ${HOOK_PATH}"
echo ""
echo "  After every 'git pull' or 'git merge', the staleness check will run automatically."
echo "  To uninstall: rm ${HOOK_PATH}"
echo ""
