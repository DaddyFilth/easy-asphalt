#!/usr/bin/env bash
set -euo pipefail

mode="${1:-release}"

if [[ "$mode" != "release" ]]; then
  echo "[mobile] Invalid iOS build mode: $mode (expected 'release')" >&2
  exit 1
fi

if [[ "${OSTYPE:-}" != darwin* ]]; then
  cat >&2 <<'EOF_ERR'
[mobile] iOS native builds require macOS with Xcode installed.
This host is not macOS, so xcodebuild cannot run here.
EOF_ERR
  exit 1
fi

if ! command -v xcodebuild >/dev/null 2>&1; then
  cat >&2 <<'EOF_ERR'
[mobile] xcodebuild not found.
Install Xcode and Xcode Command Line Tools, then run this command again.
EOF_ERR
  exit 1
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ios_dir="$repo_root/ios/App"

if [[ ! -d "$ios_dir" ]]; then
  echo "[mobile] iOS project directory not found at: $ios_dir" >&2
  exit 1
fi

echo "[mobile] Building iOS release archive with xcodebuild..."
cd "$ios_dir"
xcodebuild -workspace App.xcworkspace -scheme App -configuration Release
