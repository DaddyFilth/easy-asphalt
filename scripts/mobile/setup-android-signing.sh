#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
android_dir="$repo_root/android"
keystore_properties_file="$android_dir/keystore.properties"

force_overwrite=false
if [[ "${1:-}" == "--force" ]]; then
  force_overwrite=true
fi

if [[ -f "$keystore_properties_file" && "$force_overwrite" != true ]]; then
  read -r -p "[mobile] $keystore_properties_file exists. Overwrite? [y/N]: " overwrite
  if [[ ! "$overwrite" =~ ^[Yy]$ ]]; then
    echo "[mobile] Keeping existing keystore.properties."
    exit 0
  fi
fi

default_store_file="my-release-key.jks"
read -r -p "Keystore file path (relative to android/ or absolute) [$default_store_file]: " store_file
store_file="${store_file:-$default_store_file}"

read -r -p "Key alias: " key_alias
if [[ -z "$key_alias" ]]; then
  echo "[mobile] keyAlias cannot be empty." >&2
  exit 1
fi

read -r -s -p "Store password: " store_password
echo
if [[ -z "$store_password" ]]; then
  echo "[mobile] storePassword cannot be empty." >&2
  exit 1
fi

read -r -s -p "Key password (press Enter to reuse store password): " key_password
echo
if [[ -z "$key_password" ]]; then
  key_password="$store_password"
fi

if [[ "$store_file" = /* ]]; then
  keystore_path="$store_file"
else
  keystore_path="$android_dir/$store_file"
fi

if [[ ! -f "$keystore_path" ]]; then
  echo "[mobile] Warning: keystore file does not exist yet: $keystore_path" >&2
fi

cat >"$keystore_properties_file" <<EOF_PROPS
storeFile=$store_file
storePassword=$store_password
keyAlias=$key_alias
keyPassword=$key_password
EOF_PROPS

chmod 600 "$keystore_properties_file"

echo "[mobile] Wrote $keystore_properties_file"
echo "[mobile] Next step: pnpm mobile:build-android-signed"
