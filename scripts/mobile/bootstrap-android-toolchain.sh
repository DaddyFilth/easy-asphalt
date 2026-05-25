#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
toolchain_root="${TOOLCHAIN_ROOT:-$repo_root/.mobile-toolchain}"
jdk_dir="$toolchain_root/jdk"
sdk_dir="$toolchain_root/android-sdk"
node_dir="$toolchain_root/node"
tmp_dir="$toolchain_root/.tmp"
mkdir -p "$tmp_dir" "$sdk_dir"

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "[mobile] Missing required command: $1" >&2
    exit 1
  fi
}

need_cmd curl
need_cmd tar
need_cmd unzip

install_jdk() {
  if [[ -x "$jdk_dir/bin/java" ]]; then
    echo "[mobile] JDK already installed at $jdk_dir"
    return 0
  fi

  local archive="$tmp_dir/jdk21.tar.gz"
  local extract_dir="$tmp_dir/jdk-extract"
  rm -rf "$extract_dir"
  mkdir -p "$extract_dir"

  echo "[mobile] Downloading JDK 21..."
  curl -fsSL \
    "https://api.adoptium.net/v3/binary/latest/21/ga/linux/x64/jdk/hotspot/normal/eclipse?project=jdk" \
    -o "$archive"

  echo "[mobile] Extracting JDK..."
  tar -xzf "$archive" -C "$extract_dir"
  local extracted
  extracted="$(find "$extract_dir" -mindepth 1 -maxdepth 1 -type d | head -n 1)"
  if [[ -z "$extracted" ]]; then
    echo "[mobile] Unable to locate extracted JDK directory." >&2
    exit 1
  fi

  rm -rf "$jdk_dir"
  mv "$extracted" "$jdk_dir"
}

resolve_node_target() {
  local os arch
  os="$(uname -s | tr '[:upper:]' '[:lower:]')"
  arch="$(uname -m)"

  case "$os" in
    linux)
      case "$arch" in
        x86_64) echo "linux-x64" ;;
        aarch64 | arm64) echo "linux-arm64" ;;
        *)
          echo "[mobile] Unsupported Linux architecture for Node: $arch" >&2
          exit 1
          ;;
      esac
      ;;
    darwin)
      case "$arch" in
        x86_64) echo "darwin-x64" ;;
        arm64) echo "darwin-arm64" ;;
        *)
          echo "[mobile] Unsupported macOS architecture for Node: $arch" >&2
          exit 1
          ;;
      esac
      ;;
    *)
      echo "[mobile] Unsupported OS for Node install: $os" >&2
      exit 1
      ;;
  esac
}

install_node() {
  if [[ -x "$node_dir/bin/node" ]]; then
    local installed_major
    installed_major="$("$node_dir/bin/node" -p "process.versions.node.split('.')[0]")"
    if [[ "$installed_major" -ge 22 ]]; then
      echo "[mobile] Node.js already installed at $node_dir"
      return 0
    fi
  fi

  local node_target node_index node_version archive_name archive extract_dir extracted
  node_target="$(resolve_node_target)"
  node_index="$tmp_dir/node-index.tab"

  echo "[mobile] Resolving latest Node.js v22 release..."
  curl -fsSL "https://nodejs.org/dist/index.tab" -o "$node_index"
  node_version="$(awk 'NR > 1 && $1 ~ /^v22\./ { print $1; exit }' "$node_index")"

  if [[ -z "$node_version" ]]; then
    echo "[mobile] Failed to resolve latest Node.js v22 release." >&2
    exit 1
  fi

  archive_name="node-${node_version}-${node_target}.tar.xz"
  archive="$tmp_dir/$archive_name"
  extract_dir="$tmp_dir/node-extract"
  rm -rf "$extract_dir"
  mkdir -p "$extract_dir"

  echo "[mobile] Downloading $archive_name..."
  curl -fsSL "https://nodejs.org/dist/${node_version}/${archive_name}" -o "$archive"

  echo "[mobile] Extracting Node.js..."
  tar -xJf "$archive" -C "$extract_dir"
  extracted="$(find "$extract_dir" -mindepth 1 -maxdepth 1 -type d | head -n 1)"
  if [[ -z "$extracted" ]]; then
    echo "[mobile] Unable to locate extracted Node.js directory." >&2
    exit 1
  fi

  rm -rf "$node_dir"
  mv "$extracted" "$node_dir"
}

install_cmdline_tools() {
  local sdkmanager="$sdk_dir/cmdline-tools/latest/bin/sdkmanager"
  if [[ -x "$sdkmanager" ]]; then
    echo "[mobile] Android command-line tools already installed."
    return 0
  fi

  local repo_xml="$tmp_dir/repository2-1.xml"
  local archive_name
  local archive="$tmp_dir/cmdline-tools.zip"
  local extract_dir="$tmp_dir/cmdline-tools-extract"
  rm -rf "$extract_dir"
  mkdir -p "$extract_dir"

  echo "[mobile] Resolving latest Android command-line tools package..."
  curl -fsSL "https://dl.google.com/android/repository/repository2-1.xml" -o "$repo_xml"
  archive_name="$(
    grep -oE "commandlinetools-linux-[0-9]+_latest\\.zip" "$repo_xml" \
      | sort -u \
      | tail -n 1
  )"

  if [[ -z "$archive_name" ]]; then
    archive_name="commandlinetools-linux-13114758_latest.zip"
  fi

  echo "[mobile] Downloading $archive_name..."
  curl -fsSL "https://dl.google.com/android/repository/$archive_name" -o "$archive"

  echo "[mobile] Extracting Android command-line tools..."
  unzip -q "$archive" -d "$extract_dir"

  rm -rf "$sdk_dir/cmdline-tools/latest"
  mkdir -p "$sdk_dir/cmdline-tools"
  mv "$extract_dir/cmdline-tools" "$sdk_dir/cmdline-tools/latest"
}

install_sdk_packages() {
  local sdkmanager="$sdk_dir/cmdline-tools/latest/bin/sdkmanager"
  export JAVA_HOME="$jdk_dir"
  export PATH="$JAVA_HOME/bin:$sdk_dir/cmdline-tools/latest/bin:$PATH"
  export ANDROID_SDK_ROOT="$sdk_dir"
  export ANDROID_HOME="$sdk_dir"

  echo "[mobile] Accepting Android SDK licenses..."
  set +o pipefail
  yes | "$sdkmanager" --sdk_root="$sdk_dir" --licenses >/dev/null
  set -o pipefail

  local compile_sdk="${ANDROID_COMPILE_SDK:-36}"
  local build_tools="${ANDROID_BUILD_TOOLS:-36.0.0}"
  local packages=(
    "platform-tools"
    "platforms;android-${compile_sdk}"
    "build-tools;${build_tools}"
  )

  echo "[mobile] Installing SDK packages: ${packages[*]}"
  "$sdkmanager" --sdk_root="$sdk_dir" "${packages[@]}"
}

write_env_file() {
  cat >"$toolchain_root/env.sh" <<EOF_ENV
export JAVA_HOME="$jdk_dir"
export ANDROID_SDK_ROOT="$sdk_dir"
export ANDROID_HOME="$sdk_dir"
export NODE_HOME="$node_dir"
export PATH="\$NODE_HOME/bin:\$JAVA_HOME/bin:\$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:\$ANDROID_SDK_ROOT/platform-tools:\$PATH"
EOF_ENV

  echo "[mobile] Wrote environment helper: $toolchain_root/env.sh"
}

install_jdk
install_node
install_cmdline_tools
install_sdk_packages
write_env_file

echo "[mobile] Android toolchain setup complete."
echo "[mobile] To reuse in shell: source \"$toolchain_root/env.sh\""
