#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
android_dir="$repo_root/android"
keystore_properties_file="$android_dir/keystore.properties"

if [[ ! -f "$keystore_properties_file" ]]; then
  cat >&2 <<'EOF_ERR'
[mobile] Missing android/keystore.properties for signed release build.
Create this file with: storeFile, storePassword, keyAlias, keyPassword.
EOF_ERR
  exit 1
fi

read_property() {
  local key="$1"
  local value
  value="$(
    sed -n "s/^${key}=//p" "$keystore_properties_file" \
      | tail -n 1 \
      | tr -d '\r'
  )"
  echo "$value"
}

store_file="$(read_property storeFile)"
store_password="$(read_property storePassword)"
key_alias="$(read_property keyAlias)"
key_password="$(read_property keyPassword)"

if [[ -z "$store_file" || -z "$store_password" || -z "$key_alias" || -z "$key_password" ]]; then
  cat >&2 <<'EOF_ERR'
[mobile] android/keystore.properties is missing one or more required keys:
storeFile, storePassword, keyAlias, keyPassword
EOF_ERR
  exit 1
fi

if [[ "$store_file" = /* ]]; then
  keystore_path="$store_file"
else
  keystore_path="$android_dir/$store_file"
fi

if [[ ! -f "$keystore_path" ]]; then
  echo "[mobile] Keystore file not found: $keystore_path" >&2
  exit 1
fi

echo "[mobile] Verified Android signing inputs:"
echo "[mobile] - keystore.properties: $keystore_properties_file"
echo "[mobile] - storeFile: $keystore_path"
echo "[mobile] - keyAlias: $key_alias"

bash "$repo_root/scripts/mobile/android-build.sh" release

signed_apk="$android_dir/app/build/outputs/apk/release/app-release.apk"
unsigned_apk="$android_dir/app/build/outputs/apk/release/app-release-unsigned.apk"

if [[ -f "$signed_apk" ]]; then
  echo "[mobile] Signed release APK created: $signed_apk"
  exit 0
fi

if [[ -f "$unsigned_apk" ]]; then
  cat >&2 <<EOF_ERR
[mobile] Release build completed but output is unsigned:
$unsigned_apk
Check android/keystore.properties and signing values.
EOF_ERR
  exit 1
fi

cat >&2 <<'EOF_ERR'
[mobile] Release build finished but no release APK was found.
Check Gradle output in android/app/build/outputs/apk/release/.
EOF_ERR
exit 1
