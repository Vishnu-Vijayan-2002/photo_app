# Camera Connection & Protocols Guide

This guide details how AeroShutter communicates with professional mirrorless and DSLR cameras using standard protocols.

---

## 1. Protocol 1: Wi-Fi Background FTP Transfer (Recommended)

Modern mirrorless cameras from Sony, Canon, Nikon, and Fujifilm include native FTP clients in their firmware. When configured, the camera automatically uploads every shot taken in the background over Wi-Fi without locking up shooting operations.

### 1.1 Phone Setup
1. Turn on **Personal Hotspot** on your smartphone (or connect both camera and phone to the same Wi-Fi router / travel router).
2. Open **AeroShutter** and switch to **Wi-Fi / Hotspot FTP** mode.
3. Note the active IP address shown on the screen (usually `192.168.43.1` on Android or `172.20.10.1` on iOS) and Port `2121`.

### 1.2 Sony Setup (α7 IV, α7R V, α1, α9 II/III, FX3, etc.)
1. Press **MENU** → **Network** → **FTP Transfer Func.** → Set **FTP Function** to **ON**.
2. Select **Server Setting** → **Server 1**:
   - **Display Name:** AeroShutter
   - **Destination Setting:** Host Name: `192.168.43.1` (or your phone IP), Port: `2121`.
   - **Directory Setting:** Current Directory (`/`).
   - **User Info Setting:** Set User to `aeroshutter` (or anonymous), Password blank.
   - **Passive Mode:** ON.
3. Under **Auto FTP Transfer**, set to **ON**. Select **Transfer Target**: JPEG Only, RAW Only, or RAW+JPEG.
4. Join your phone's Wi-Fi Hotspot. Take a shot: the photo will appear in AeroShutter in under 2 seconds!

### 1.3 Canon Setup (EOS R5, R6, R3, 1D X Mark III, etc.)
1. Press **MENU** → **Communication Settings** (Purple Tab).
2. Select **Wi-Fi / Bluetooth Connection** → **FTP Transfer**.
3. Add a device to connect to:
   - Select **Configure Offline** or connect to your phone's hotspot SSID.
   - **FTP Mode:** FTP or FTPS.
   - **IP Address:** Phone IP (e.g., `192.168.43.1`), Port: `2121`.
   - **Passive Mode:** Enable.
   - **Login Method:** Anonymous (or enter `aeroshutter`).
   - **Target Folder:** Root directory.
4. Select **Auto Transfer** → **Enable**.

### 1.4 Nikon Setup (Z8, Z9, Z6 II, Z7 II, etc.)
1. Press **MENU** → **Network Menu** → **Connect to FTP Server**.
2. Create FTP Profile:
   - **Host:** Enter phone's IP address.
   - **Port:** `2121`.
   - **PASV (Passive Mode):** ON.
   - **Anonymous Login:** ON.
3. Set **Options** → **Auto Send** to **ON**.

---

## 2. Protocol 2: USB-OTG Direct Cable Tether

For high-speed studio workflows, USB-C tethering utilizes the **Picture Transfer Protocol (ISO 15740)** over the Android USB Host API.

### Hardware Requirements
- USB-C to USB-C cable (USB 3.2 Gen 2 recommended for full 10Gbps bandwidth).
- Android device with USB OTG support.

### Camera Configuration
- **Sony:** Menu → Network → USB-LAN/Tethering → **PC Remote** (or USB Connection → PC Remote).
- **Canon:** Menu → Communication → USB Connection App → **Photo Import / Remote Control**.
- **Nikon:** Connect cable → Camera switches to PTP MTP Mass Storage automatically.

When plugged in, Android prompts: *"Allow AeroShutter to access this USB device?"* Tap **Always Allow**. AeroShutter establishes a PTP session `0x1002`, listens for event code `0x4002` (`ObjectAdded`), and retrieves incoming photos with zero latency.

