# AeroShutter Application Architecture

## 1. System Philosophy & Design Goals

AeroShutter is a professional cross-platform mobile application engineered to connect digital cameras (Sony, Canon, Nikon, Fujifilm) to smartphones, stream newly captured photos in real time, and automatically upload them to Google Drive without requiring a laptop or memory card swapping.

### Core Architectural Pillars
1. **Zero External Machine Dependency:** Operates fully standalone on mobile devices (Android and iOS).
2. **Multi-Protocol Camera Ingestion:**
   - **Embedded Wi-Fi FTP Server:** Zero-cable auto-transfer directly from modern camera firmware.
   - **USB-OTG PTP/MTP Direct Tether:** Sub-second wired transfer for high-volume studio shoots.
   - **Hot-Folder Storage Watcher:** Direct import from USB-C SD card readers.
   - **Mock Camera Simulator:** Built-in hardware simulator for testing, QA, and demos.
3. **Resilient Cloud Pipeline:** Official Google Drive v3 Resumable Upload protocol with automatic chunk slicing, byte offset recovery, and exponential backoff retry.
4. **Clean-Room Independent Implementation:** 100% original code without proprietary asset reuse or copyrighted materials.

---

## 2. Component Hierarchy & Flow

```mermaid
graph TD
    subgraph CaptureLayer["1. Camera Ingestion"]
        Sony["Sony α (FTP/USB)"]
        Canon["Canon EOS (FTP/USB)"]
        Nikon["Nikon Z (FTP/USB)"]
        Fuji["Fujifilm X (FTP/USB)"]
        Sim["Mock Simulator"]
    end

    subgraph NativeBridge["2. Native Platform Layer"]
        AndroidFTP["Android: CameraFtpServer (Port 2121)"]
        AndroidUSB["Android: UsbTetherModule (PTP)"]
        iOSFTP["iOS: CameraFtpServerModule (NWListener)"]
        StorageMod["NativeStorageModule"]
    end

    subgraph AppCore["3. Application Core (React Native & TypeScript)"]
        CamMgr["CameraManager"]
        Exif["ExifParser"]
        StorageMgr["PhotoStorageManager"]
        NetMon["NetworkMonitor"]
        DB[(SQLite Persistent DB)]
        QueueMgr["UploadQueueManager"]
        Resumable["ResumableUploader"]
    end

    subgraph Presentation["4. UI/UX Layer"]
        HUD["CameraStatusHUD"]
        LiveFeed["LiveShootScreen"]
        Gallery["PhotoGrid / ExifInspector / Histogram"]
        Sessions["SessionsScreen"]
        Cloud["CloudSyncScreen / Speedometer"]
    end

    CaptureLayer --> NativeBridge
    NativeBridge --> AppCore
    AppCore --> Presentation
    QueueMgr -->|HTTPS Resumable PUT| GoogleDrive["Google Drive API v3"]
```

---

## 3. Data Ingestion & Storage Architecture

When a shutter click occurs on a connected camera:
1. **Ingestion Socket:** The camera firmware transmits the file via FTP `STOR` or USB PTP `GetObject`.
2. **Local Persistence:** The native module streams the byte buffer into app scoped storage:
   `Context.getExternalFilesDir()/Photos/DSC_XXXX.[ARW|CR3|NEF|JPG]`.
3. **EXIF Telemetry Extraction:** `ExifParser` parses TIFF/APP1 headers to extract shutter speed, aperture, ISO, focal length, camera model, and lens name.
4. **Database Record Creation:** A row is inserted into the SQLite `photos` table linked to the active `session_id`.
5. **Upload Enqueueing:** `UploadQueueManager` creates an entry in `upload_queue` with status `PENDING`.
6. **Reactive UI Dispatch:** Events update `LiveShootScreen`, instantly displaying the thumbnail and upload progress.

---

## 4. Google Drive Resumable Upload Specification

AeroShutter implements the Google Drive API v3 Resumable Upload protocol:

```mermaid
sequenceDiagram
    participant App as AeroShutter Queue
    participant GDrive as Google Drive API

    App->>GDrive: POST /upload/drive/v3/files?uploadType=resumable
    Note over App,GDrive: Headers: X-Upload-Content-Type, X-Upload-Content-Length
    GDrive-->>App: HTTP 200/201 Created (Location: https://www.googleapis.com/.../upload_id=xxx)
    
    loop Sliced Byte Chunks (512KB - 2MB)
        App->>GDrive: PUT upload_id with Content-Range: bytes START-END/TOTAL
        alt Intermediate Chunk
            GDrive-->>App: HTTP 308 Resume Incomplete (Range: bytes=0-CURRENT)
        else Final Chunk
            GDrive-->>App: HTTP 200/201 OK { id: "drive_file_id" }
        end
    end

    Note over App: Update Database: status = 'COMPLETED'
```
