#!/usr/bin/env bash
set -euo pipefail

mode="${1:-debug}"

if [[ "$mode" != "debug" && "$mode" != "release" ]]; then
  echo "[mobile] Invalid build mode: $mode (expected 'debug' or 'release')" >&2
  exit 1
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
android_dir="$repo_root/android"

resolve_java_home() {
  local local_jdk="$repo_root/.mobile-toolchain/jdk"
  if [[ -x "$local_jdk/bin/java" ]]; then
    echo "$local_jdk"
    return 0
  fi

  if [[ -n "${JAVA_HOME:-}" && -x "${JAVA_HOME}/bin/java" ]]; then
    echo "$JAVA_HOME"
    return 0
  fi

  if command -v javac >/dev/null 2>&1; then
    local javac_bin
    javac_bin="$(command -v javac)"
    echo "$(cd "$(dirname "$javac_bin")/.." && pwd)"
    return 0
  fi

  if command -v java >/dev/null 2>&1; then
    local java_bin
    java_bin="$(command -v java)"
    echo "$(cd "$(dirname "$java_bin")/.." && pwd)"
    return 0
  fi

  local candidates=(
    "/opt/android-studio/jbr"
    "$HOME/android-studio/jbr"
    "/Applications/Android Studio.app/Contents/jbr/Contents/Home"
  )

  for candidate in "${candidates[@]}"; do
    if [[ -x "$candidate/bin/java" ]]; then
      echo "$candidate"
      return 0
    fi
  done

  return 1
}

resolve_android_sdk_root() {
  local local_sdk="$repo_root/.mobile-toolchain/android-sdk"
  if [[ -d "$local_sdk" ]]; then
    echo "$local_sdk"
    return 0
  fi

  if [[ -n "${ANDROID_SDK_ROOT:-}" && -d "${ANDROID_SDK_ROOT}" ]]; then
    echo "$ANDROID_SDK_ROOT"
    return 0
  fi

  if [[ -n "${ANDROID_HOME:-}" && -d "${ANDROID_HOME}" ]]; then
    echo "$ANDROID_HOME"
    return 0
  fi

  if [[ -d "$HOME/Android/Sdk" ]]; then
    echo "$HOME/Android/Sdk"
    return 0
  fi

  if [[ -d "$HOME/Library/Android/sdk" ]]; then
    echo "$HOME/Library/Android/sdk"
    return 0
  fi

  return 1
}

if ! detected_java_home="$(resolve_java_home)"; then
  cat >&2 <<'EOF_ERR'
[mobile] Android build prerequisites missing: Java runtime not found.
Install JDK 21+ and set JAVA_HOME, or install Android Studio (embedded JBR is auto-detected).
EOF_ERR
  exit 1
fi

export JAVA_HOME="$detected_java_home"
export PATH="$JAVA_HOME/bin:$PATH"

if ! detected_sdk_root="$(resolve_android_sdk_root)"; then
  cat >&2 <<'EOF_ERR'
[mobile] Android SDK not found.
Set ANDROID_SDK_ROOT (or ANDROID_HOME) to your SDK location.
Typical path on Linux: $HOME/Android/Sdk
EOF_ERR
  exit 1
fi

export ANDROID_SDK_ROOT="$detected_sdk_root"
export ANDROID_HOME="$detected_sdk_root"
export GRADLE_USER_HOME="${GRADLE_USER_HOME:-$repo_root/.mobile-toolchain/gradle}"
mkdir -p "$GRADLE_USER_HOME"

if [[ ! -d "$android_dir" ]]; then
  echo "[mobile] Android project directory not found at: $android_dir" >&2
  exit 1
fi

if [[ "$mode" == "debug" ]]; then
  task="assembleDebug"
else
  task="assembleRelease"
fi

echo "[mobile] Using JAVA_HOME=$JAVA_HOME"
echo "[mobile] Using ANDROID_SDK_ROOT=$ANDROID_SDK_ROOT"
echo "[mobile] Using GRADLE_USER_HOME=$GRADLE_USER_HOME"

cd "$android_dir"
./gradlew "$task"
