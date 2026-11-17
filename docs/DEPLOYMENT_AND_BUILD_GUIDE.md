# Build, Deployment & App Store Publishing Guide

This document outlines the end-to-end instructions for building, packaging, and deploying AeroShutter for Android (Google Play Store) and iOS (Apple App Store).

---

## 1. Prerequisites

- **Node.js:** v18.0.0 or higher (v20+ recommended)
- **Java Development Kit (JDK):** JDK 17
- **Android SDK:** Platforms 34/35, Build-Tools 35.0.0
- **Xcode (for iOS):** Xcode 15 or higher with iOS 15+ SDK
- **CocoaPods (for iOS):** 1.13+

---

## 2. Dependency Installation

From the project root directory (`photo_app`):
```bash
npm install
```

---

## 3. Android Build & Packaging

### 3.1 Local Development Build
Run on a connected Android phone or emulator:
```bash
npm run android
```

### 3.2 Generating Android Release Keystore
To sign the production build:
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore android/app/release.keystore \
  -alias aeroshutter-release -keyalg RSA -keysize 2048 -validity 10000
```

Add your credentials to `android/gradle.properties`:
```properties
MYAPP_RELEASE_STORE_FILE=release.keystore
MYAPP_RELEASE_KEY_ALIAS=aeroshutter-release
MYAPP_RELEASE_STORE_PASSWORD=your_password
MYAPP_RELEASE_KEY_PASSWORD=your_password
```

### 3.3 Building Google Play Store Android App Bundle (.aab)
To generate the Play Store publication package:
```bash
cd android
./gradlew bundleRelease
```
The resulting AAB file is generated at:
`android/app/build/outputs/bundle/release/app-release.aab`

### 3.4 Building Standalone Android APK (.apk)
For direct distribution, manual sideloading, or device testing:
```bash
cd android
./gradlew assembleRelease
```
The resulting APK is generated at:
`android/app/build/outputs/apk/release/app-release.apk`

---

## 4. iOS Build & Packaging

### 4.1 Pod Installation
```bash
cd ios
pod install
cd ..
```

### 4.2 Running in iOS Simulator / Connected iPhone
```bash
npm run ios
```

### 4.3 App Store Archive (.ipa)
1. Open `ios/AeroShutter.xcworkspace` in Xcode.
2. Select **Generic iOS Device** (or your connected iPhone).
3. Under **Signing & Capabilities**, select your Apple Developer Team and Provisioning Profile.
4. Select **Product** → **Archive**.
5. Once the build completes in the Organizer, click **Distribute App** → **App Store Connect** to upload directly to TestFlight and App Store review.

---

## 5. Automated Verification & Test Commands

Run the comprehensive unit and integration test suite:
```bash
npm test
```

Run test suite with coverage report:
```bash
npm run test:coverage
```

Run TypeScript strict type checking:
```bash
npm run typecheck
```

