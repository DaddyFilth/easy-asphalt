#!/bin/bash

# Wireless ADB Connection Helper Script
# This script helps you connect to your Android device wirelessly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Wireless ADB Connection Helper ===${NC}"
echo ""

# Check if ADB is available
if ! command -v adb &> /dev/null; then
    echo -e "${RED}Error: ADB not found. Please install Android SDK platform-tools.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ ADB found: $(adb version | head -n 1)${NC}"
echo ""

# Check for connected devices
echo -e "${YELLOW}Checking for connected devices...${NC}"
CONNECTED_DEVICES=$(adb devices | grep -v "List of devices" | grep -v "^$" | wc -l)

if [ $CONNECTED_DEVICES -gt 0 ]; then
    echo -e "${GREEN}Found $CONNECTED_DEVICES connected device(s):${NC}"
    adb devices
    echo ""
    echo -e "${GREEN}✓ Device(s) already connected!${NC}"
    echo ""
    echo -e "${YELLOW}Do you want to install the APK? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
        if [ -f "$APK_PATH" ]; then
            echo -e "${GREEN}Installing APK...${NC}"
            adb install "$APK_PATH"
            echo -e "${GREEN}✓ APK installed successfully!${NC}"
            echo ""
            echo -e "${YELLOW}Do you want to launch the app? (y/n)${NC}"
            read -r launch_response
            if [[ "$launch_response" =~ ^[Yy]$ ]]; then
                echo -e "${GREEN}Launching app...${NC}"
                adb shell am start -n com.daddyfilth.drivewayestimator/.MainActivity
                echo -e "${GREEN}✓ App launched!${NC}"
            fi
        else
            echo -e "${RED}Error: APK not found at $APK_PATH${NC}"
            echo -e "${YELLOW}Run: pnpm mobile:build-android-debug${NC}"
        fi
    fi
    exit 0
fi

echo -e "${YELLOW}No devices currently connected.${NC}"
echo ""

# Menu for connection methods
echo -e "${BLUE}Choose connection method:${NC}"
echo "1) Pair device using QR code (Android 11+)"
echo "2) Pair device using pairing code (Android 11+)"
echo "3) Connect via IP address (USB initial connection required)"
echo "4) Show device IP setup instructions"
echo "5) Exit"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo -e "${YELLOW}Method 1: Pair using QR code${NC}"
        echo ""
        echo "On your Android device:"
        echo "1. Go to Settings → System → Developer Options"
        echo "2. Enable 'Wireless Debugging'"
        echo "3. Tap 'Pair device using QR code'"
        echo ""
        read -p "Press Enter when ready to display QR code..."
        echo ""
        adb pair
        echo ""
        echo -e "${GREEN}✓ Scan the QR code on your device${NC}"
        ;;
    2)
        echo -e "${YELLOW}Method 2: Pair using pairing code${NC}"
        echo ""
        read -p "Enter device IP address: " device_ip
        read -p "Enter port (default 37123): " port
        port=${port:-37123}
        echo ""
        echo "On your Android device:"
        echo "1. Go to Settings → System → Developer Options"
        echo "2. Enable 'Wireless Debugging'"
        echo "3. Tap 'Pair using pairing code'"
        echo "4. Note the 6-digit pairing code"
        echo ""
        adb pair "$device_ip:$port"
        echo ""
        echo -e "${GREEN}✓ Pairing initiated${NC}"
        ;;
    3)
        echo -e "${YELLOW}Method 3: Connect via IP address${NC}"
        echo ""
        read -p "Enter device IP address: " device_ip
        read -p "Enter port (default 5555): " port
        port=${port:-5555}
        echo ""
        echo -e "${BLUE}Connecting to $device_ip:$port...${NC}"
        adb connect "$device_ip:$port"
        echo ""
        echo -e "${GREEN}✓ Connection attempt completed${NC}"
        adb devices
        ;;
    4)
        echo -e "${YELLOW}How to find your device IP address:${NC}"
        echo ""
        echo "On your Android device:"
        echo "1. Go to Settings → Network & Internet → Wi-Fi"
        echo "2. Tap on your connected network"
        echo "3. Look for 'IP address' field"
        echo "4. Note the IP address (e.g., 192.168.1.100)"
        echo ""
        echo "Make sure both your device and computer are on the same WiFi network."
        ;;
    5)
        echo -e "${YELLOW}Exiting...${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice. Exiting...${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}=== Verify Connection ===${NC}"
adb devices

echo ""
echo -e "${GREEN}✓ Connection process completed${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. If your device is listed above, run this script again to install the APK"
echo "2. Or manually install: adb install android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo -e "${YELLOW}For detailed instructions, see: WIRELESS_ADB_GUIDE.md${NC}"
