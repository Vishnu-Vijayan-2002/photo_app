# AeroShutter – Real-Time Camera Tethering & Instant Cloud Upload

[![Platform: Android & iOS](https://img.shields.io/badge/platform-Android%20%7C%20iOS-brightgreen.svg)](#)
[![TypeScript](https://img.shields.io/badge/language-TypeScript-blue.svg)](#)
[![Kotlin](https://img.shields.io/badge/native-Kotlin-orange.svg)](#)
[![Swift](https://img.shields.io/badge/native-Swift-red.svg)](#)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](#)

AeroShutter is a production-grade, cross-platform mobile application engineered for professional photographers. It bridges digital mirrorless and DSLR cameras (Sony, Canon, Nikon, Fujifilm) directly to mobile smartphones for real-time photo streaming and automatic resumable upload to Google Drive.

Built from scratch as an independent, clean-room rebuild of mobile camera tethering functionality inspired by reference tools like Satset (`com.satsetmobile.max`), AeroShutter provides significantly upgraded architecture, cross-platform support (Android + iOS), native background daemons, and full RAW file handling.

---

## 🌟 Key Capabilities

- **Zero Laptop Required:** Complete on-location tethering workflow straight from your smartphone.
- **Lightroom-Style Presets & Color Grading Studio:**
  - **Curated Built-In Presets:** Kodak Portra 400 Film, Cinematic Warm (Teal & Orange), Moody Monochrome, Nordic Clean Commercial, Golden Hour Glow, Vintage 70s Matte.
  - **Custom Preset Upload & Import:** Import Adobe Lightroom `.xmp` presets, `.cube` 3D LUTs, or export/import JSON presets.
  - **Tactile Color Grading Tools:** Manual control over Exposure, Contrast, Highlights, Shadows, White Balance Temperature (Kelvin), Tint, Vibrance, Saturation, Clarity, Vignette, and Matte Fade.
  - **Flexible Transfer Workflows:** Choice to transfer pristine RAW sensor files directly, apply presets and upload high-res graded photos, or execute dual uploads (both RAW and graded).
  - **Hold-to-Compare:** Real-time Before/After instant comparison toggle.
- **Multiple Camera Connection Protocols:**
  - **Embedded Wi-Fi FTP Server:** High-speed, non-root TCP FTP server listening on port `2121`. Sony, Canon, Nikon, and Fujifilm cameras upload photos automatically over Wi-Fi/Hotspot immediately upon shutter actuation.
  - **USB-OTG PTP/MTP Tether:** Direct high-speed wired transfer using Android's native `UsbManager` and PTP (ISO 15740) session commands.
  - **Storage Hot-Folder Watcher:** Automatic import from external USB-C SD card readers.
  - **Built-in Mock Camera Simulator:** Simulate Sony α7 IV, Canon EOS R5, or Nikon Z8 bursts with realistic EXIF and RAW streams for offline testing.
- **Google Drive Automatic Cloud Sync:**
  - Chunked Resumable Upload protocol (512KB - 2MB slices) capable of handling massive 50MB+ RAW files (`.ARW`, `.CR3`, `.NEF`, `.RAF`).
  - Automatic byte-offset querying on network interruption with zero repeated byte transmission.
  - Background concurrency management with network-aware pause/resume (e.g. Wi-Fi Only policy).
- **Relational ACID Storage:**
  - SQLite database schema tracking Sessions, Photos, and Upload Queue states with transactional integrity.
- **Photographer-Centric UI/UX:**
  - Modern OLED Dark Theme with high contrast HUD metrics.
  - Live photo ingestion stream with instant thumbnail rendering.
  - Full EXIF Telemetry inspector (Shutter, Aperture, ISO, Focal Length, Camera Model, Lens).
  - Real-time RGB & Luminance histogram.
  - Live upload speedometer and Google Drive storage quota gauge.
  - Diagnostic test suite for USB OTG, Wi-Fi IP, and Google Drive API latency.

---

## 📁 Repository Structure

```
d:\photo_app\
├── package.json
├── tsconfig.json
├── app.json
├── index.js
├── src/
│   ├── App.tsx                     # Main App Root & Provider Hierarchy
│   ├── theme/                      # Photographer Dark & Light Themes
│   ├── types/                      # TypeScript Interface Definitions
│   ├── database/                   # SQLite Schema, Repositories (Session, Photo, Queue)
│   ├── services/
│   │   ├── camera/                 # CameraManager, FTP Daemon, USB Tether, Mock Camera
│   │   ├── cloud/                  # GoogleAuth, GoogleDrive, ResumableUploader
│   │   ├── queue/                  # UploadQueueManager, NetworkMonitor
│   │   ├── storage/                # PhotoStorageManager
│   │   └── exif/                   # ExifParser (TIFF/APP1 Header Decoder)
│   ├── context/                    # AppContext, CameraContext, SessionContext, UploadContext
│   ├── components/                 # Reusable UI System (HUD, Badges, Modals, PhotoGrid, etc.)
│   ├── screens/                    # LiveShoot, Gallery, Sessions, CloudSync, Diagnostics, Settings
│   └── navigation/                 # AppNavigator (Bottom Tab Bar with reactive badges)
├── android/                        # Android Gradle project & native Kotlin modules
├── ios/                            # iOS Xcode workspace, Podfile & native Swift modules
├── __tests__/                      # Comprehensive Unit & Integration Test Suite
└── docs/                           # Architecture, Protocol, Google Drive & Build Guides
```

---

## 🚀 Quick Start Guide

### 1. Installation
```bash
npm install
```

### 2. Running Unit Tests
```bash
npm test
```

### 3. Running on Android
```bash
npm run android
```

### 4. Running on iOS
```bash
cd ios && pod install && cd ..
npm run ios
```

### 5. Building Production Packages
- **Android App Bundle (.aab) for Google Play:**
  ```bash
  cd android && ./gradlew bundleRelease
  ```
- **Android APK (.apk):**
  ```bash
  cd android && ./gradlew assembleRelease
  ```

---

## 📚 Technical Documentation

- [Architecture & Design Specification](docs/ARCHITECTURE.md)
- [Camera Protocols & Brand Setup Guide](docs/CAMERA_PROTOCOLS_GUIDE.md)
- [Google Drive Resumable Upload Specification](docs/GOOGLE_DRIVE_INTEGRATION.md)
- [Deployment & App Store Publishing Guide](docs/DEPLOYMENT_AND_BUILD_GUIDE.md)
- [Reverse Engineering & Clean-Room Analysis](file:///C:/Users/vishn/.gemini/antigravity/brain/01c38306-d5ae-42b8-8927-04306bdc18b5/REVERSE_ENGINEERING_ANALYSIS.md)
