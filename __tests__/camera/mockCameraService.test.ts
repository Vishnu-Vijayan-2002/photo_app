import { mockCameraService } from '../../src/services/camera/MockCameraService';

describe('AeroShutter Mock Camera Service', () => {
  afterEach(async () => {
    await mockCameraService.disconnect();
  });

  test('should initialize and connect with default profile', async () => {
    mockCameraService.setProfile('Sony');
    const info = mockCameraService.getCameraInfo();

    expect(info.brand).toBe('Sony');
    expect(info.model).toBe('ILCE-7M4');

    const connected = await mockCameraService.connect();
    expect(connected).toBe(true);
    expect(mockCameraService.getCameraInfo().status).toBe('CONNECTED');
  });

  test('should generate simulated shots with realistic EXIF and RAW parameters', () => {
    mockCameraService.setProfile('Canon');
    const shot = mockCameraService.captureShot({ forceRaw: true });

    expect(shot.fileName.endsWith('.CR3')).toBe(true);
    expect(shot.isRaw).toBe(true);
    expect(shot.rawFormat).toBe('CR3');
    expect(shot.fileSize).toBeGreaterThan(30 * 1024 * 1024); // >30MB RAW file
    expect(shot.exif.make).toBe('Canon');
  });

  test('should handle Nikon Z8 simulation profile', () => {
    mockCameraService.setProfile('Nikon');
    const shot = mockCameraService.captureShot({ forceRaw: true });

    expect(shot.fileName.endsWith('.NEF')).toBe(true);
    expect(shot.rawFormat).toBe('NEF');
    expect(shot.exif.make).toBe('Nikon');
  });
});

