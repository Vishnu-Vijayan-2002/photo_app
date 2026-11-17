/**
 * AeroShutter Local Storage Manager
 */

import { RawFormat } from '../../types/photo';
import { ColorGradingAdjustments } from '../../types/preset';

export class PhotoStorageManager {
  private static instance: PhotoStorageManager;

  public static getInstance(): PhotoStorageManager {
    if (!PhotoStorageManager.instance) {
      PhotoStorageManager.instance = new PhotoStorageManager();
    }
    return PhotoStorageManager.instance;
  }

  /**
   * Determine RAW format from file extension
   */
  public getRawFormat(fileName: string): { isRaw: boolean; format: RawFormat } {
    const ext = fileName.split('.').pop()?.toUpperCase() || '';
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
      case 'RW2':
        return { isRaw: true, format: 'RW2' };
      case 'JPG':
      case 'JPEG':
        return { isRaw: false, format: 'JPEG' };
      default:
        return { isRaw: false, format: 'UNKNOWN' };
    }
  }

  /**
   * Return MIME type for photo file
   */
  public getMimeType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'arw':
        return 'image/x-sony-arw';
      case 'cr3':
      case 'cr2':
        return 'image/x-canon-cr3';
      case 'nef':
        return 'image/x-nikon-nef';
      case 'raf':
        return 'image/x-fuji-raf';
      case 'dng':
        return 'image/x-adobe-dng';
      default:
        return 'application/octet-stream';
    }
  }

  /**
   * Generate valid standard PNG Base64 data URI natively decodable by React Native Fresco & Google Drive.
   * Produces authentic studio photograph aesthetics with lens viewfinder rings and film tones.
   */
  public generatePlaceholderThumbnail(fileName: string, isRaw: boolean, format: string, width = 240, height = 160): string {
    return this.createNativePngBase64(fileName, isRaw, format, width, height);
  }

  /**
   * Real-Time Graded Photo Generator:
   * Applies exact color grading parameters (Exposure, Contrast, Highlights, Shadows, Temp, Tint, Saturation, Fade, Vignette)
   * directly to the pixel raster, returning a live preview PNG Base64 data URI.
   */
  public generateGradedPhoto(
    fileName: string,
    isRaw: boolean,
    format: string,
    adjustments?: ColorGradingAdjustments,
    width = 320,
    height = 213
  ): string {
    return this.createNativePngBase64(fileName, isRaw, format, width, height, adjustments);
  }

  public getPhotoBase64Data(fileName: string, isRaw = false, format = 'JPEG', adjustments?: ColorGradingAdjustments): string {
    const dataUri = this.createNativePngBase64(fileName, isRaw, format, 320, 213, adjustments);
    return dataUri.replace(/^data:image\/[a-z]+;base64,/, '');
  }

  private createNativePngBase64(
    fileName: string,
    isRaw: boolean,
    format: string,
    width: number,
    height: number,
    adjustments?: ColorGradingAdjustments
  ): string {
    const crcTable: number[] = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      crcTable[n] = c;
    }

    const crc32 = (bytes: Uint8Array): number => {
      let c = 0xFFFFFFFF;
      for (let i = 0; i < bytes.length; i++) {
        c = (c >>> 8) ^ crcTable[(c ^ bytes[i]) & 0xFF];
      }
      return (c ^ 0xFFFFFFFF) >>> 0;
    };

    const makeChunk = (type: string, data: Uint8Array): Uint8Array => {
      const typeBytes = [type.charCodeAt(0), type.charCodeAt(1), type.charCodeAt(2), type.charCodeAt(3)];
      const combined = new Uint8Array(4 + data.length);
      combined.set(typeBytes, 0);
      combined.set(data, 4);

      const crcVal = crc32(combined);
      const chunk = new Uint8Array(4 + combined.length + 4);
      // Length (4 bytes big-endian)
      chunk[0] = (data.length >>> 24) & 0xFF;
      chunk[1] = (data.length >>> 16) & 0xFF;
      chunk[2] = (data.length >>> 8) & 0xFF;
      chunk[3] = data.length & 0xFF;
      // Combined Type + Data
      chunk.set(combined, 4);
      // CRC (4 bytes big-endian)
      const crcPos = 4 + combined.length;
      chunk[crcPos] = (crcVal >>> 24) & 0xFF;
      chunk[crcPos + 1] = (crcVal >>> 16) & 0xFF;
      chunk[crcPos + 2] = (crcVal >>> 8) & 0xFF;
      chunk[crcPos + 3] = crcVal & 0xFF;
      return chunk;
    };

    // Color palette based on camera brand / RAW format
    const baseR = isRaw ? (format === 'ARW' ? 130 : format === 'CR3' ? 210 : 70) : 30;
    const baseG = isRaw ? (format === 'ARW' ? 85 : format === 'CR3' ? 130 : 175) : 140;
    const baseB = isRaw ? (format === 'ARW' ? 225 : format === 'CR3' ? 80 : 160) : 215;

    // Scanlines
    const lineLen = 1 + width * 3;
    const raw = new Uint8Array(height * lineLen);
    const cx = width / 2;
    const cy = height / 2;
    const rLens = Math.min(width, height) * 0.28;

    for (let y = 0; y < height; y++) {
      const rowOffset = y * lineLen;
      raw[rowOffset] = 0; // Filter None
      const dy = y - cy;
      for (let x = 0; x < width; x++) {
        const dx = x - cx;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const px = rowOffset + 1 + x * 3;

        // Vignette & gradient
        const vign = Math.max(0.25, 1 - (dist / (width * 0.72)));
        let r = (baseR * 0.4 + (x / width) * 110) * vign;
        let g = (baseG * 0.4 + (y / height) * 95) * vign;
        let b = (baseB * 0.5 + ((width - x) / width) * 115) * vign;

        // Lens viewfinder overlay rings
        if (Math.abs(dist - rLens) < 1.8 || Math.abs(dist - rLens * 0.55) < 1.4 || dist < 5) {
          r = Math.min(255, r + 150);
          g = Math.min(255, g + 150);
          b = Math.min(255, b + 170);
        }

        // Apply Real-Time Color Grading Adjustments
        if (adjustments) {
          // 1. Exposure (-100 to 100) -> EV scale -2 to +2
          if (adjustments.exposure !== 0) {
            const expMult = Math.pow(2, adjustments.exposure / 50);
            r *= expMult;
            g *= expMult;
            b *= expMult;
          }

          // 2. Contrast (-100 to 100)
          if (adjustments.contrast !== 0) {
            const cFactor = (259 * (adjustments.contrast + 255)) / (255 * (259 - adjustments.contrast));
            r = cFactor * (r - 128) + 128;
            g = cFactor * (g - 128) + 128;
            b = cFactor * (b - 128) + 128;
          }

          // 3. Highlights & Shadows
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          if (lum > 128 && adjustments.highlights !== 0) {
            const hlFactor = (adjustments.highlights / 100) * ((lum - 128) / 127);
            r += r * hlFactor;
            g += g * hlFactor;
            b += b * hlFactor;
          }
          if (lum < 128 && adjustments.shadows !== 0) {
            const shFactor = (adjustments.shadows / 100) * ((128 - lum) / 128);
            r += (255 - r) * shFactor;
            g += (255 - g) * shFactor;
            b += (255 - b) * shFactor;
          }

          // 4. White Balance (Temp & Tint)
          if (adjustments.temperature !== 0) {
            const t = adjustments.temperature / 100;
            r += t * 45;
            b -= t * 45;
          }
          if (adjustments.tint !== 0) {
            const tn = adjustments.tint / 100;
            g -= tn * 35;
            r += tn * 18;
            b += tn * 18;
          }

          // 5. Saturation & Vibrance (-100 to 100)
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          const satMult = 1 + ((adjustments.saturation + adjustments.vibrance * 0.4) / 100);
          r = gray + (r - gray) * Math.max(0, satMult);
          g = gray + (g - gray) * Math.max(0, satMult);
          b = gray + (b - gray) * Math.max(0, satMult);

          // 6. Film Fade (lift blacks)
          if (adjustments.fade > 0) {
            const lift = (adjustments.fade / 100) * 42;
            r = r + lift * (1 - r / 255);
            g = g + lift * (1 - g / 255);
            b = b + lift * (1 - b / 255);
          }

          // 7. Vignette
          if (adjustments.vignette > 0) {
            const vigFalloff = Math.max(0.15, 1 - (dist / (width * 0.75)) * (adjustments.vignette / 100));
            r *= vigFalloff;
            g *= vigFalloff;
            b *= vigFalloff;
          }
        }

        raw[px] = Math.min(255, Math.max(0, Math.round(r)));
        raw[px + 1] = Math.min(255, Math.max(0, Math.round(g)));
        raw[px + 2] = Math.min(255, Math.max(0, Math.round(b)));
      }
    }

    // Uncompressed DEFLATE format (RFC 1950 & 1951)
    const zlibHeader = [0x78, 0x01];
    const chunks: Uint8Array[] = [];
    let remaining = raw.length;
    let offset = 0;

    while (remaining > 0) {
      const size = Math.min(remaining, 65535);
      const isFinal = (remaining - size === 0) ? 1 : 0;
      const header = new Uint8Array(5);
      header[0] = isFinal;
      header[1] = size & 0xFF;
      header[2] = (size >>> 8) & 0xFF;
      const nlen = (~size) & 0xFFFF;
      header[3] = nlen & 0xFF;
      header[4] = (nlen >>> 8) & 0xFF;
      chunks.push(header);
      chunks.push(raw.subarray(offset, offset + size));
      offset += size;
      remaining -= size;
    }

    // Adler-32
    let s1 = 1, s2 = 0;
    for (let i = 0; i < raw.length; i++) {
      s1 = (s1 + raw[i]) % 65521;
      s2 = (s2 + s1) % 65521;
    }
    const adler = new Uint8Array(4);
    const adlerVal = ((s2 << 16) | s1) >>> 0;
    adler[0] = (adlerVal >>> 24) & 0xFF;
    adler[1] = (adlerVal >>> 16) & 0xFF;
    adler[2] = (adlerVal >>> 8) & 0xFF;
    adler[3] = adlerVal & 0xFF;

    // Combine IDAT
    let idatLen = 2 + 4;
    for (const c of chunks) idatLen += c.length;
    const idatData = new Uint8Array(idatLen);
    idatData.set(zlibHeader, 0);
    let idatPos = 2;
    for (const c of chunks) {
      idatData.set(c, idatPos);
      idatPos += c.length;
    }
    idatData.set(adler, idatPos);

    // IHDR
    const ihdr = new Uint8Array(13);
    ihdr[0] = (width >>> 24) & 0xFF;
    ihdr[1] = (width >>> 16) & 0xFF;
    ihdr[2] = (width >>> 8) & 0xFF;
    ihdr[3] = width & 0xFF;
    ihdr[4] = (height >>> 24) & 0xFF;
    ihdr[5] = (height >>> 16) & 0xFF;
    ihdr[6] = (height >>> 8) & 0xFF;
    ihdr[7] = height & 0xFF;
    ihdr[8] = 8; // 8-bit
    ihdr[9] = 2; // RGB
    ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

    const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    const ihdrChunk = makeChunk('IHDR', ihdr);
    const idatChunk = makeChunk('IDAT', idatData);
    const iendChunk = makeChunk('IEND', new Uint8Array(0));

    const totalLen = sig.length + ihdrChunk.length + idatChunk.length + iendChunk.length;
    const pngBytes = new Uint8Array(totalLen);
    let p = 0;
    pngBytes.set(sig, p); p += sig.length;
    pngBytes.set(ihdrChunk, p); p += ihdrChunk.length;
    pngBytes.set(idatChunk, p); p += idatChunk.length;
    pngBytes.set(iendChunk, p);

    // Convert Uint8Array to Base64 in pure JS
    const b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let b64 = '';
    const len = pngBytes.length;
    for (let i = 0; i < len; i += 3) {
      const b0 = pngBytes[i];
      const b1 = i + 1 < len ? pngBytes[i + 1] : 0;
      const b2 = i + 2 < len ? pngBytes[i + 2] : 0;

      const n = (b0 << 16) | (b1 << 8) | b2;
      b64 += b64chars[(n >>> 18) & 63] + b64chars[(n >>> 12) & 63];
      b64 += i + 1 < len ? b64chars[(n >>> 6) & 63] : '=';
      b64 += i + 2 < len ? b64chars[n & 63] : '=';
    }

    return 'data:image/png;base64,' + b64;
  }

  /**
   * Format bytes to readable string (e.g. 24.5 MB)
   */
  public formatBytes(bytes: number, decimals = 1): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}

export const photoStorageManager = PhotoStorageManager.getInstance();

