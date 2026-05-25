# Driveway Estimator Pro - Mobile Build Guide

This project uses **Capacitor** to wrap the React web application as native iOS and Android apps. This guide explains how to build and deploy the mobile applications for internal distribution.

## Prerequisites

### For iOS Development

- macOS with Xcode 14.0 or later
- Xcode Command Line Tools: `xcode-select --install`
- CocoaPods: `sudo gem install cocoapods`
- Apple Developer Account (for signing and distribution)

### For Android Development

- Android Studio 2021.1 or later
- Android SDK (API level 28 or higher)
- Java Development Kit (JDK) 21 or later
- Android NDK (optional, for native code)

### General Requirements

- Node.js 22+ and pnpm (Capacitor CLI requirement)
- Capacitor CLI (installed as dev dependency)

## Project Structure

```
driveway-estimator-pro/
├── client/              # React web app source
├── server/              # Express backend
├── ios/                 # iOS native project (Xcode)
├── android/             # Android native project (Gradle)
├── dist/                # Built web assets
├── capacitor.config.ts  # Capacitor configuration
└── package.json         # Build scripts
```

## Build Scripts

All mobile build commands are defined in `package.json`:

| Script                              | Purpose                                                           |
| ----------------------------------- | ----------------------------------------------------------------- |
| `pnpm mobile:build`                 | Build web assets and sync to native projects                      |
| `pnpm mobile:setup-android`         | Install local JDK/SDK/Node 22 toolchain under `.mobile-toolchain` |
| `pnpm mobile:setup-android-signing` | Interactive setup for `android/keystore.properties`               |
| `pnpm mobile:ios`                   | Build web, sync, and open iOS project in Xcode                    |
| `pnpm mobile:android`               | Build web, sync, and open Android project in Android Studio       |
| `pnpm mobile:build-ios`             | Create iOS release build (macOS + Xcode preflight)                |
| `pnpm mobile:build-android`         | Create Android release build (auto-detects Java/SDK env)          |
| `pnpm mobile:build-android-signed`  | Build + sync + signed Android release APK                         |
| `pnpm mobile:build-android-debug`   | Create installable debug APK for internal sharing                 |
| `pnpm mobile:apk`                   | Build web assets, sync Android, and create a debug APK            |

## Development Workflow

### 1. Web Development

During development, run the web app in dev mode:

```bash
pnpm dev
```

### 2. Testing on iOS Simulator

**First time setup:**

```bash
# Install dependencies
pnpm install

# Build web assets and sync to iOS
pnpm mobile:ios
```

This opens Xcode with the iOS project. In Xcode:

1. Select "iPhone 15" (or your preferred simulator) from the device dropdown
2. Click the "Play" button to build and run on the simulator
3. The app will launch in the simulator

**For subsequent builds:**

```bash
pnpm mobile:build
# Then use Xcode's Run button (⌘R)
```

### 3. Testing on Android Emulator

**First time setup:**

```bash
# Install dependencies
pnpm install

# Install local Android toolchain (JDK + SDK)
pnpm mobile:setup-android

# Build web assets and sync to Android
pnpm mobile:android
```

This opens Android Studio with the Android project. In Android Studio:

1. Create or select an Android Virtual Device (AVD)
2. Click "Run" or press Shift+F10 to build and deploy to the emulator
3. The app will launch in the emulator

**For subsequent builds:**

```bash
pnpm mobile:build
# Then use Android Studio's Run button
```

## Building Release Apps

### iOS Release Build

1. **Prepare signing:**
   - Open `ios/App/App.xcworkspace` in Xcode
   - Select "App" target
   - Go to "Signing & Capabilities"
   - Select your team and update the bundle identifier if needed

2. **Build release:**

   ```bash
   pnpm mobile:build-ios
   ```

3. **Distribute:**
   - Archive in Xcode: Product → Archive
   - Use Xcode's Organizer to distribute via App Store Connect, TestFlight, or Ad Hoc

### Android Release Build

For a quick internal APK you can sideload for testing:

```bash
pnpm mobile:apk
```

The debug APK will be at:
`android/app/build/outputs/apk/debug/app-debug.apk`

1. **Prepare signing:**
   - Create a keystore file (if you don't have one):
     ```bash
     keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
     ```
   - Place `my-release-key.jks` in the `android/` directory
   - Create `android/keystore.properties`:
     ```properties
     storeFile=my-release-key.jks
     storePassword=your_store_password
     keyAlias=my-key-alias
     keyPassword=your_key_password
     ```
   - Keep both files private. They are ignored by git and are required to
     publish updates signed with the same certificate.
   - Quick local setup helper:
     ```bash
     pnpm mobile:setup-android-signing
     ```

2. **Build release APK:**

   ```bash
   pnpm mobile:build-android
   ```

   Without signing config, output is:
   `android/app/build/outputs/apk/release/app-release-unsigned.apk`

   To enforce signing and fail fast if signing config is incomplete:

   ```bash
   pnpm mobile:build-android-signed
   ```

   Signed output:
   `android/app/build/outputs/apk/release/app-release.apk`

3. **Build release AAB (for Play Store):**
   ```bash
   cd android && ./gradlew bundleRelease
   ```
   The AAB will be at: `android/app/build/outputs/bundle/release/app-release.aab`

## Internal Distribution

### iOS (Ad Hoc Distribution)

1. **Create Ad Hoc provisioning profile:**
   - Go to Apple Developer Portal
   - Create a new Ad Hoc provisioning profile for your app
   - Download and install it

2. **Build and sign:**
   - In Xcode, select "Any iOS Device (arm64)"
   - Product → Archive
   - In Organizer, select Archive → Distribute App → Ad Hoc
   - Select your signing identity and provisioning profile
   - Export the `.ipa` file

3. **Distribute:**
   - Share the `.ipa` file with testers
   - Testers can install via Xcode, Apple Configurator, or TestFlight

### Android (Internal Testing)

1. **Build APK:**

   ```bash
   pnpm mobile:build-android-signed
   ```

2. **Distribute:**
   - Share `android/app/build/outputs/apk/release/app-release.apk` with testers
   - Testers can install via: `adb install app-release.apk`
   - Or use Google Play Console's Internal Testing track

## Capacitor Plugins

The following Capacitor plugins are integrated:

- **@capacitor/camera** - Camera capture and photo library access
- **@capacitor/geolocation** - GPS location services

### Permissions

**iOS (`ios/App/App/Info.plist`):**

```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access to capture driveway photos</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to provide accurate local pricing</string>
```

**Android (`android/app/src/main/AndroidManifest.xml`):**

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

These are already configured in the native projects.

## Troubleshooting

### iOS Issues

**"xcodebuild: not found" / non-macOS host:**

- `pnpm mobile:build-ios` now performs a platform preflight and requires:
  - macOS host (`darwin`)
  - Xcode + Command Line Tools (`xcodebuild` in `PATH`)
- On Linux/Windows, use macOS CI or a Mac build machine for native iOS builds.

**"Pod install failed":**

```bash
cd ios/App
rm -rf Pods Podfile.lock
pod install
```

**"Xcode build failed":**

- Clean build: Product → Clean Build Folder (⇧⌘K)
- Update pods: `pod repo update`

### Android Issues

**"JAVA_HOME is not set" / Java not found:**

- `pnpm mobile:build-android` and `pnpm mobile:build-android-debug` now auto-detect Java from:
  - local repo toolchain at `.mobile-toolchain/jdk`
  - `JAVA_HOME`
  - `javac` / `java` in `PATH`
  - Android Studio embedded JBR (common macOS/Linux paths)
- If Java is still not detected, install JDK 21+ or Android Studio.

**"Android SDK not found":**

- Set one of these environment variables:
  - `.mobile-toolchain/android-sdk` (auto-detected after `pnpm mobile:setup-android`)
  - `ANDROID_SDK_ROOT=/path/to/Android/Sdk`
  - `ANDROID_HOME=/path/to/Android/Sdk`

**"Release APK is unsigned":**

- Use `pnpm mobile:build-android-signed` to enforce keystore validation.
- Ensure `android/keystore.properties` includes:
  - `storeFile`
  - `storePassword`
  - `keyAlias`
  - `keyPassword`
- Use `pnpm mobile:setup-android-signing` to generate this file interactively.

**"Gradle sync failed":**

- File → Sync Now
- Check Android SDK versions in `android/app/build.gradle`

**"Build failed with missing dependencies":**

```bash
cd android
./gradlew clean
./gradlew build
```

## Environment Variables

The app uses the same environment variables as the web version. For mobile builds, ensure these are set:

```bash
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
VITE_APP_ID=your_oauth_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_API_BASE_URL=https://your-production-app.example.com
MOBILE_ALLOWED_ORIGINS=https://your-production-app.example.com
# ... other environment variables
```

## Continuous Integration

For automated builds, configure your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
name: Mobile Build
on: [push, pull_request]

jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: pnpm install
      - run: pnpm mobile:build-ios
      - run: pnpm mobile:build-android
```

This repository now includes Android CI at:
`.github/workflows/mobile-android.yml`

- Triggers on pull requests, pushes to `main`, and manual runs
- Builds:
  - Android debug (`app-debug.apk`)
  - Android release (`app-release-unsigned.apk`)
  - Android signed release (`app-release.apk`) when secrets are configured
- Required secrets for signed CI release:
  - `ANDROID_KEYSTORE_BASE64`
  - `ANDROID_KEYSTORE_PASSWORD`
  - `ANDROID_KEY_ALIAS`
  - `ANDROID_KEY_PASSWORD`

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Development](https://developer.apple.com/documentation)
- [Android Development](https://developer.android.com/docs)
- [Capacitor Camera Plugin](https://capacitorjs.com/docs/apis/camera)
- [Capacitor Geolocation Plugin](https://capacitorjs.com/docs/apis/geolocation)

## Support

For issues or questions:

1. Check the Capacitor docs
2. Review native platform documentation
3. Check the GitHub repository issues
4. Contact the development team
