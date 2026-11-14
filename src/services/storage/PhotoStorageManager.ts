/**
 * AeroShutter Local Storage Manager
 */

import { RawFormat } from '../../types/photo';

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
   * Generate lightweight high-contrast SVG preview data URI for instant photo rendering
   */
  public generatePlaceholderThumbnail(fileName: string, isRaw: boolean, format: string, width = 400, height = 267): string {
    const bgColor = isRaw ? '#1A1226' : '#111822';
    const accentColor = isRaw ? '#BB86FC' : '#00D1FF';
    const badgeText = isRaw ? `RAW • ${format}` : 'JPEG';

    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${bgColor}"/>
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.2"/>
            <stop offset="100%" stop-color="${bgColor}" stop-opacity="0.8"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)"/>
        
        <!-- Camera Lens aperture icon -->
        <circle cx="${width / 2}" cy="${height / 2 - 15}" r="38" stroke="${accentColor}" stroke-width="2" fill="none" opacity="0.6"/>
        <circle cx="${width / 2}" cy="${height / 2 - 15}" r="22" stroke="${accentColor}" stroke-width="1.5" fill="none" opacity="0.4"/>
        <circle cx="${width / 2}" cy="${height / 2 - 15}" r="8" fill="${accentColor}" opacity="0.7"/>

        <!-- Photo label -->
        <text x="${width / 2}" y="${height / 2 + 42}" font-family="sans-serif" font-size="12" fill="#E2E8F0" text-anchor="middle" font-weight="600">
          ${fileName}
        </text>

        <!-- Badge -->
        <rect x="${width / 2 - 38}" y="${height / 2 + 55}" width="76" height="18" rx="4" fill="${accentColor}" opacity="0.2"/>
        <text x="${width / 2}" y="${height / 2 + 68}" font-family="sans-serif" font-size="10" fill="${accentColor}" text-anchor="middle" font-weight="700">
          ${badgeText}
        </text>
      </svg>
    `;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
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
