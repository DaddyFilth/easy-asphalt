# Wireless ADB Setup Guide

## Prerequisites

✅ **ADB Version**: 34.0.5-debian (supports wireless pairing)  
✅ **APK Ready**: `android/app/build/outputs/apk/debug/app-debug.apk`  
✅ **Android Device Required**: With Developer Options enabled

---

## Method 1: Wireless Pairing (Android 11+) - Recommended

This method works without USB connection for devices running Android 11+.

### Step 1: Enable Developer Options on Your Android Device

1. Go to **Settings** → **About Phone**
2. Tap **Build Number** 7 times to enable Developer Options
3. Go back to **Settings** → **System** → **Developer Options**

### Step 2: Enable Wireless Debugging

1. In Developer Options, enable **Wireless Debugging**
2. You'll see a pairing option with QR code or pairing code

### Step 3: Pair Device Using QR Code

```bash
# On your computer, run:
adb pair
```

This will display a QR code. Scan it with your Android device from the Wireless Debugging screen.

### Step 4: Or Pair Using Pairing Code

```bash
# On your Android device, select "Pair using pairing code"
# You'll see a 6-digit code (e.g., 123456)

# On your computer, run:
adb pair <device-ip>:<port>
# You'll be prompted for the pairing code
```

To find your device IP:
- Go to **Settings** → **Network & Internet** → **Wi-Fi**
- Tap on your connected network
- Note the IP address (e.g., 192.168.1.100)

### Step 5: Connect to Device

```bash
# After pairing, connect to the device:
adb connect <device-ip>:<port>
# Default port is usually 5555
```

---

## Method 2: Wireless Debugging (USB Initial Connection Required)

For older Android versions or if Method 1 doesn't work.

### Step 1: Connect Device via USB

1. Connect your Android device to your computer via USB
2. Accept the USB debugging prompt on your device

### Step 2: Verify USB Connection

```bash
adb devices
# You should see your device listed
```

### Step 3: Enable Wireless Debugging

```bash
# Set up TCP/IP on port 5555
adb tcpip 5555
```

### Step 4: Get Device IP Address

On your Android device:
- Go to **Settings** → **Network & Internet** → **Wi-Fi**
- Tap on your connected network
- Note the IP address (e.g., 192.168.1.100)

### Step 5: Connect Wirelessly

```bash
# Connect to the device wirelessly
adb connect <device-ip>:5555

# Example:
adb connect 192.168.1.100:5555
```

### Step 6: Disconnect USB (Optional)

Once wireless connection is established, you can disconnect the USB cable.

---

## Method 3: Using Android Studio (If Available)

1. Open Android Studio
2. Go to **Run** → **Edit Configurations**
3. Select your device from the dropdown
4. Click **Run** to deploy

---

## Deploy the APK

Once your device is connected wirelessly:

### Install the APK

```bash
# Install the debug APK
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Launch the App

```bash
# Launch the app after installation
adb shell am start -n com.daddyfilth.drivewayestimator/.MainActivity
```

### Or Just Run the App

```bash
# Alternative: Use Android Studio's run button
# Or tap the app icon on your device
```

---

## Verify Connection

```bash
# Check connected devices
adb devices

# Should show something like:
# List of devices attached
# 192.168.1.100:5555    device
```

---

## Troubleshooting

### Device Not Found

```bash
# Check ADB server status
adb kill-server
adb start-server
adb devices
```

### Connection Refused

- Make sure your device and computer are on the same network
- Disable VPN on both devices
- Check firewall settings
- Try using Method 2 (USB initial connection)

### Pairing Fails

- Make sure Wireless Debugging is enabled on the device
- Try restarting ADB: `adb kill-server && adb start-server`
- Ensure both devices are on the same WiFi network

### APK Installation Fails

```bash
# Uninstall old version first
adb uninstall com.daddyfilth.drivewayestimator

# Install new version
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Quick Reference Commands

```bash
# Check ADB version
adb version

# List connected devices
adb devices

# Pair device (Android 11+)
adb pair <device-ip>:<port>

# Connect wirelessly
adb connect <device-ip>:5555

# Disconnect wireless
adb disconnect <device-ip>:5555

# Disconnect all
adb disconnect

# Install APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Uninstall app
adb uninstall com.daddyfilth.drivewayestimator

# Launch app
adb shell am start -n com.daddyfilth.drivewayestimator/.MainActivity

# View logs
adb logcat

# View app-specific logs
adb logcat | grep driveway
```

---

## Security Notes

⚠️ **Important Security Considerations**:

1. **Network Security**: Only connect to trusted networks
2. **Public WiFi**: Avoid using wireless ADB on public WiFi networks
3. **Disable When Not in Use**: Turn off wireless debugging when not needed
4. **Device Lock**: Ensure your device has screen lock enabled
5. **Revoke Access**: Unpair your device from your computer when done

### To Disable Wireless Debugging

On your Android device:
- Go to **Settings** → **System** → **Developer Options**
- Disable **Wireless Debugging**

---

## APK Information

**App ID**: `com.daddyfilth.drivewayestimator`  
**App Name**: Driveway Estimator Pro  
**APK Location**: `android/app/build/outputs/apk/debug/app-debug.apk`  
**APK Size**: 8.7MB  
**Build Type**: Debug  
**Platform**: Android  

---

## Next Steps

1. ✅ Enable Developer Options on your Android device
2. ✅ Enable Wireless Debugging
3. ✅ Pair/connect your device wirelessly
4. ✅ Install the APK
5. ✅ Test the application

---

## Support

If you encounter issues:
1. Check that both devices are on the same network
2. Verify Wireless Debugging is enabled on your device
3. Try restarting ADB: `adb kill-server && adb start-server`
4. Check firewall settings
5. Ensure your device screen is unlocked during connection
