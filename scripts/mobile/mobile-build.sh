#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
toolchain_node="$repo_root/.mobile-toolchain/node/bin/node"
cap_cli="$repo_root/node_modules/@capacitor/cli/bin/capacitor"

resolve_cap_node() {
  if command -v node >/dev/null 2>&1; then
    local system_node system_major
    system_node="$(command -v node)"
    system_major="$("$system_node" -p "process.versions.node.split('.')[0]")"
    if [[ "$system_major" -ge 22 ]]; then
      echo "$system_node"
      return 0
    fi
  fi

  if [[ -x "$toolchain_node" ]]; then
    local local_major
    local_major="$("$toolchain_node" -p "process.versions.node.split('.')[0]")"
    if [[ "$local_major" -ge 22 ]]; then
      echo "$toolchain_node"
      return 0
    fi
  fi

  return 1
}

echo "[mobile] Building web assets..."
corepack pnpm build

if [[ ! -f "$cap_cli" ]]; then
  cat >&2 <<'EOF_ERR'
[mobile] Capacitor CLI not found in node_modules.
Run 'corepack pnpm install' and try again.
EOF_ERR
  exit 1
fi

if ! cap_node="$(resolve_cap_node)"; then
  cat >&2 <<'EOF_ERR'
[mobile] Capacitor sync requires Node.js 22+.
Install Node.js 22+ globally or run 'corepack pnpm mobile:setup-android' to install a local toolchain.
EOF_ERR
  exit 1
fi

cap_node_version="$("$cap_node" -p "process.versions.node")"
echo "[mobile] Syncing Capacitor using Node.js $cap_node_version"
"$cap_node" "$cap_cli" sync
