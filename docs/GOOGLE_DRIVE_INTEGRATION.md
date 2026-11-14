# Google Drive Integration & Cloud Synchronization

## 1. OAuth 2.0 Authorization & Scopes

AeroShutter integrates with the Google Drive API v3 to automate cloud storage.

### Principle of Least Privilege
AeroShutter requests only the restricted scope:
- `https://www.googleapis.com/auth/drive.file`

This scope ensures:
- The app can **only** read, edit, and upload files created by AeroShutter.
- The app has **zero access** to any other existing personal files or folders in the user's Google Drive.

---

## 2. Chunked Resumable Upload Architecture

Mobile network connections at remote shoot locations or wedding venues are susceptible to signal loss, cell tower handoffs, and bandwidth fluctuations. Traditional multipart uploads fail completely if interrupted mid-stream, forcing a complete restart of 50MB RAW files.

AeroShutter solves this using **Chunked Resumable Uploads**:

### Step 1: Initiating Session
```http
POST /upload/drive/v3/files?uploadType=resumable HTTP/1.1
Host: www.googleapis.com
Authorization: Bearer <access_token>
Content-Type: application/json; charset=UTF-8
X-Upload-Content-Type: image/x-sony-arw
X-Upload-Content-Length: 42123980

{
  "name": "DSC_0042.ARW",
  "parents": ["1g9Hk...folder_id..."]
}
```

Google responds with:
```http
HTTP/1.1 200 OK
Location: https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=xa890123...
```

### Step 2: Streaming Chunk Slices
The file is sliced into 512KB-2MB chunks:
```http
PUT /upload/drive/v3/files?uploadType=resumable&upload_id=xa890123... HTTP/1.1
Content-Length: 2097152
Content-Range: bytes 0-2097151/42123980

<binary payload 2MB>
```

When incomplete:
```http
HTTP/1.1 308 Resume Incomplete
Range: bytes=0-2097151
```

### Step 3: Network Interruption Recovery
If the cell connection drops, AeroShutter queries the server for the current byte offset:
```http
PUT /upload/drive/v3/files?uploadType=resumable&upload_id=xa890123... HTTP/1.1
Content-Length: 0
Content-Range: bytes */42123980
```
Google responds with the exact received range: `Range: bytes=0-15728639`. AeroShutter immediately resumes from byte `15728640` with zero data loss!
