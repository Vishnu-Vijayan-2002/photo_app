import { ExifParser } from '../../src/services/exif/ExifParser';
import { photoStorageManager } from '../../src/services/storage/PhotoStorageManager';

describe('AeroShutter EXIF & Storage Telemetry', () => {
  test('should detect RAW format types correctly', () => {
    expect(photoStorageManager.getRawFormat('DSC001.ARW')).toEqual({ isRaw: true, format: 'ARW' });
    expect(photoStorageManager.getRawFormat('IMG_002.CR3')).toEqual({ isRaw: true, format: 'CR3' });
    expect(photoStorageManager.getRawFormat('_NIK003.NEF')).toEqual({ isRaw: true, format: 'NEF' });
    expect(photoStorageManager.getRawFormat('FUJI004.RAF')).toEqual({ isRaw: true, format: 'RAF' });
    expect(photoStorageManager.getRawFormat('PHOTO005.JPG')).toEqual({ isRaw: false, format: 'JPEG' });
  });

  test('should format file sizes cleanly', () => {
    expect(photoStorageManager.formatBytes(0)).toBe('0 B');
    expect(photoStorageManager.formatBytes(1024)).toBe('1 KB');
    expect(photoStorageManager.formatBytes(45 * 1024 * 1024)).toBe('45 MB');
  });

  test('should return valid EXIF metadata structure with safe fallbacks', () => {
    const dummyBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x10, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00]);
    const exif = ExifParser.parse(dummyBytes);

    expect(exif).toBeDefined();
    expect(exif.aperture).toBeDefined();
    expect(exif.shutterSpeed).toBeDefined();
    expect(exif.iso).toBeGreaterThan(0);
  });
});

