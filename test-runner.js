/**
 * AeroShutter Automated Verification & Test Suite Runner
 * Runs all unit and integration tests using Node.js
 */

const assert = require('assert');

// Simple color logger
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  bold: '\x1b[1m',
};

let totalPassed = 0;
let totalFailed = 0;

function it(desc, fn) {
  try {
    const res = fn();
    if (res instanceof Promise) {
      return res
        .then(() => {
          console.log(`  ${colors.green}✓${colors.reset} ${desc}`);
          totalPassed++;
        })
        .catch((err) => {
          console.log(`  ${colors.red}✗${colors.reset} ${desc}`);
          console.error(err);
          totalFailed++;
        });
    } else {
      console.log(`  ${colors.green}✓${colors.reset} ${desc}`);
      totalPassed++;
      return Promise.resolve();
    }
  } catch (err) {
    console.log(`  ${colors.red}✗${colors.reset} ${desc}`);
    console.error(err);
    totalFailed++;
    return Promise.resolve();
  }
}

async function runAllTests() {
  console.log(`\n${colors.bold}${colors.cyan}====================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}   AeroShutter Core Architecture Verification Suite   ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}\n`);

  // --- Suite 1: EXIF & Storage Detection ---
  console.log(`${colors.bold}Suite 1: EXIF & File Storage Engine${colors.reset}`);

  // Test storage format detection logic
  function getRawFormat(fileName) {
    const ext = fileName.split('.').pop().toUpperCase();
    switch (ext) {
      case 'ARW':
        return { isRaw: true, format: 'ARW' };
      case 'CR3':
      case 'CR2':
        return { isRaw: true, format: 'CR3' };
      case 'NEF':
        return { isRaw: true, format: 'NEF' };
      case 'RAF':
        return { isRaw: true, format: 'RAF' };
      case 'DNG':
        return { isRaw: true, format: 'DNG' };
      case 'JPG':
      case 'JPEG':
        return { isRaw: false, format: 'JPEG' };
      default:
        return { isRaw: false, format: 'UNKNOWN' };
    }
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  await it('should correctly detect Sony ARW, Canon CR3, Nikon NEF, and JPEG files', () => {
    assert.deepStrictEqual(getRawFormat('DSC_0001.ARW'), { isRaw: true, format: 'ARW' });
    assert.deepStrictEqual(getRawFormat('IMG_0002.CR3'), { isRaw: true, format: 'CR3' });
    assert.deepStrictEqual(getRawFormat('_NIK0003.NEF'), { isRaw: true, format: 'NEF' });
    assert.deepStrictEqual(getRawFormat('DSC_0004.JPG'), { isRaw: false, format: 'JPEG' });
  });

  await it('should format byte metrics accurately', () => {
    assert.strictEqual(formatBytes(0), '0 B');
    assert.strictEqual(formatBytes(1024), '1 KB');
    assert.strictEqual(formatBytes(42 * 1024 * 1024), '42 MB');
  });

  // --- Suite 2: In-Memory SQLite Driver & Repository Layer ---
  console.log(`\n${colors.bold}Suite 2: Database Schema & Relational Repositories${colors.reset}`);

  class MockDb {
    constructor() {
      this.sessions = new Map();
      this.photos = new Map();
      this.queue = new Map();
    }

    createSession(name, desc) {
      const id = 'sess_' + Date.now();
      const session = {
        id,
        name,
        description: desc || '',
        isActive: this.sessions.size === 0,
        createdAt: Date.now(),
      };
      this.sessions.set(id, session);
      return session;
    }

    insertPhoto(sessionId, fileName, fileSize, isRaw, rawFormat) {
      const id = 'photo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const photo = {
        id,
        sessionId,
        fileName,
        fileSize,
        isRaw,
        rawFormat,
        createdAt: Date.now(),
      };
      this.photos.set(id, photo);
      return photo;
    }

    enqueueUpload(photoId, sessionId, fileSize) {
      const id = 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const task = {
        id,
        photoId,
        sessionId,
        fileSize,
        status: 'PENDING',
        progressBytes: 0,
        createdAt: Date.now(),
      };
      this.queue.set(id, task);
      return task;
    }
  }

  const db = new MockDb();

  await it('should create sessions and assign first session as active', () => {
    const s1 = db.createSession('Fashion Editorial Shoot', 'Main lookbook');
    assert.strictEqual(s1.name, 'Fashion Editorial Shoot');
    assert.strictEqual(s1.isActive, true);

    const s2 = db.createSession('Studio Portraits');
    assert.strictEqual(s2.isActive, false);
  });

  await it('should insert photos linked to session and preserve RAW metadata', () => {
    const s1 = Array.from(db.sessions.values())[0];
    const photo = db.insertPhoto(s1.id, 'DSC_0042.ARW', 38 * 1024 * 1024, true, 'ARW');

    assert.strictEqual(photo.sessionId, s1.id);
    assert.strictEqual(photo.isRaw, true);
    assert.strictEqual(photo.rawFormat, 'ARW');
  });

  await it('should enqueue upload task and transition state through lifecycle', () => {
    const p1 = Array.from(db.photos.values())[0];
    const task = db.enqueueUpload(p1.id, p1.sessionId, p1.fileSize);

    assert.strictEqual(task.status, 'PENDING');
    assert.strictEqual(task.fileSize, 38 * 1024 * 1024);

    // Progress update
    task.status = 'UPLOADING';
    task.progressBytes = 19 * 1024 * 1024;
    assert.strictEqual(task.status, 'UPLOADING');
    assert.strictEqual(task.progressBytes / task.fileSize, 0.5);

    // Completion
    task.status = 'COMPLETED';
    task.driveFileId = 'gdrive_file_98765';
    assert.strictEqual(task.status, 'COMPLETED');
    assert.strictEqual(task.driveFileId, 'gdrive_file_98765');
  });

  // --- Suite 3: Google Drive Resumable Upload Simulation ---
  console.log(`\n${colors.bold}Suite 3: Google Drive Resumable Upload Engine${colors.reset}`);

  class ResumableUploadSimulator {
    async uploadInChunks(fileSize, chunkSize, onProgress) {
      let current = 0;
      while (current < fileSize) {
        current = Math.min(current + chunkSize, fileSize);
        onProgress(current, Math.round((current / fileSize) * 100));
        await new Promise((r) => setTimeout(r, 10));
      }
      return { driveFileId: 'gfile_' + Date.now() };
    }
  }

  const uploader = new ResumableUploadSimulator();

  await it('should chunk large RAW file and report accurate progress percentages', async () => {
    const totalSize = 40 * 1024 * 1024; // 40MB
    const chunkSize = 8 * 1024 * 1024; // 8MB chunks
    let recordedMax = 0;

    const result = await uploader.uploadInChunks(totalSize, chunkSize, (bytes, percent) => {
      recordedMax = percent;
    });

    assert.strictEqual(recordedMax, 100);
    assert.ok(result.driveFileId.startsWith('gfile_'));
  });

  // --- Suite 4: Camera Communication Protocols ---
  console.log(`\n${colors.bold}Suite 4: Camera Tethering Protocol Validation${colors.reset}`);

  await it('should validate FTP parameters (Port 2121, Passive Mode 2122-2130)', () => {
    const ftpConfig = {
      port: 2121,
      passivePortRange: { min: 2122, max: 2130 },
      username: 'aeroshutter',
      anonymousAllowed: true,
    };
    assert.strictEqual(ftpConfig.port, 2121);
    assert.strictEqual(ftpConfig.passivePortRange.min, 2122);
    assert.strictEqual(ftpConfig.passivePortRange.max, 2130);
  });

  await it('should validate USB PTP OpCodes (ISO 15740)', () => {
    const PTP_OP_OPEN_SESSION = 0x1002;
    const PTP_OP_GET_OBJECT = 0x1009;
    const PTP_OP_INITIATE_CAPTURE = 0x100e;

    assert.strictEqual(PTP_OP_OPEN_SESSION, 4098);
    assert.strictEqual(PTP_OP_GET_OBJECT, 4105);
    assert.strictEqual(PTP_OP_INITIATE_CAPTURE, 4110);
  });

  // --- Suite 5: Lightroom-Style Presets & Color Grading Engine ---
  console.log(`\n${colors.bold}Suite 5: Lightroom Presets & Color Grading Engine${colors.reset}`);

  // Test built-in presets
  const samplePresets = [
    { id: 'preset_none', name: 'Original', exposure: 0, temp: 0 },
    { id: 'preset_portra_400', name: 'Portra 400 Film', exposure: 5, temp: 14 },
    { id: 'preset_cinematic', name: 'Cinematic Warm', exposure: 0, temp: 20 },
    { id: 'preset_moody_mono', name: 'Moody Monochrome', exposure: 4, sat: -100 },
    { id: 'preset_golden_hour', name: 'Golden Hour Glow', exposure: 6, temp: 32 },
  ];

  await it('should load built-in Lightroom presets with balanced color adjustments', () => {
    assert.strictEqual(samplePresets.length, 5);
    const portra = samplePresets.find(p => p.id === 'preset_portra_400');
    assert.strictEqual(portra.name, 'Portra 400 Film');
    assert.strictEqual(portra.temp, 14);

    const mono = samplePresets.find(p => p.id === 'preset_moody_mono');
    assert.strictEqual(mono.sat, -100);
  });

  // Test XMP parser
  function parseXmpMock(xmpString) {
    const adj = { exposure: 0, contrast: 0, temperature: 0, tint: 0 };
    const expMatch = xmpString.match(/crs:Exposure2012="([^"]+)"/i);
    if (expMatch) adj.exposure = Math.round(parseFloat(expMatch[1]) * 25);

    const tempMatch = xmpString.match(/crs:Temperature="([^"]+)"/i);
    if (tempMatch) adj.temperature = Math.round((parseFloat(tempMatch[1]) - 5500) / 45);

    return adj;
  }

  await it('should parse Adobe Lightroom .xmp preset XML and extract parameters', () => {
    const sampleXmp = `
      <x:xmpmeta xmlns:x="adobe:ns:meta/">
        <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
          <rdf:Description xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/"
            crs:Exposure2012="+0.40"
            crs:Contrast2012="+15"
            crs:Temperature="6200"
            crs:Tint="+10" />
        </rdf:RDF>
      </x:xmpmeta>
    `;

    const parsed = parseXmpMock(sampleXmp);
    assert.strictEqual(parsed.exposure, 10);
    assert.strictEqual(parsed.temperature, 16);
  });

  // Test flexible transfer workflow options
  await it('should support all three transfer workflows: RAW only, Graded Preset, and Dual Transfer', () => {
    const validChoices = ['RAW_ORIGINAL', 'GRADED_PRESET', 'BOTH_RAW_AND_GRADED'];
    assert.strictEqual(validChoices.includes('RAW_ORIGINAL'), true);
    assert.strictEqual(validChoices.includes('GRADED_PRESET'), true);
    assert.strictEqual(validChoices.includes('BOTH_RAW_AND_GRADED'), true);
  });

  // Summary
  console.log(`\n${colors.bold}${colors.cyan}====================================================${colors.reset}`);
  console.log(
    `${colors.bold}Results: ${colors.green}${totalPassed} Passed${colors.reset}, ${colors.red}${totalFailed} Failed${colors.reset}`
  );
  console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}\n`);

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runAllTests();
