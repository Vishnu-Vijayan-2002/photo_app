/**
 * AeroShutter Mock Camera Service
 * Simulates real professional mirrorless cameras (Sony A7 IV, Canon EOS R5, Nikon Z8)
 * for testing, demonstration, and automated verification without external camera hardware.
 */

import { CameraInfo, ExifData } from '../../types/camera';
import { photoStorageManager } from '../storage/PhotoStorageManager';

export interface SimulatedShot {
  fileName: string;
  localPath: string;
  thumbnailPath: string;
  fileSize: number;
  mimeType: string;
  isRaw: boolean;
  rawFormat: 'ARW' | 'CR3' | 'NEF' | 'JPEG';
  exif: ExifData;
  width: number;
  height: number;
}

export class MockCameraService {
  private static instance: MockCameraService;
  private isConnected = false;
  private timer: any = null;
  private shotCounter = 1;
  private selectedProfile: 'Sony' | 'Canon' | 'Nikon' = 'Sony';
  private onPhotoCallback?: (shot: SimulatedShot) => void;

  public static getInstance(): MockCameraService {
    if (!MockCameraService.instance) {
      MockCameraService.instance = new MockCameraService();
    }
    return MockCameraService.instance;
  }

  public setPhotoCallback(cb: (shot: SimulatedShot) => void) {
    this.onPhotoCallback = cb;
  }

  public setProfile(profile: 'Sony' | 'Canon' | 'Nikon') {
    this.selectedProfile = profile;
  }

  public getCameraInfo(): CameraInfo {
    const profileData = {
      Sony: {
        name: 'ILCE-7M4 (Sony α7 IV)',
        brand: 'Sony' as const,
        model: 'ILCE-7M4',
        lens: 'FE 24-70mm F2.8 GM II',
        firmware: 'v3.01',
      },
      Canon: {
        name: 'Canon EOS R5',
        brand: 'Canon' as const,
        model: 'EOS R5',
        lens: 'RF 28-70mm F2 L USM',
        firmware: 'v1.9.0',
      },
      Nikon: {
        name: 'Nikon Z8',
        brand: 'Nikon' as const,
        model: 'Z 8',
        lens: 'NIKKOR Z 24-70mm f/2.8 S',
        firmware: 'v2.00',
      },
    }[this.selectedProfile];

    return {
      id: 'mock_cam_001',
      name: profileData.name,
      brand: profileData.brand,
      model: profileData.model,
      mode: 'MOCK_SIMULATOR',
      status: this.isConnected ? 'CONNECTED' : 'DISCONNECTED',
      batteryLevel: 87,
      firmwareVersion: profileData.firmware,
      serialNumber: 'SN-90234812',
      connectedAt: this.isConnected ? Date.now() - 360000 : undefined,
    };
  }

  public async connect(): Promise<boolean> {
    this.isConnected = true;
    return true;
  }

  public async disconnect(): Promise<void> {
    this.stopAutoCapture();
    this.isConnected = false;
  }

  public startAutoCapture(intervalMs = 4000) {
    this.stopAutoCapture();
    this.timer = setInterval(() => {
      if (this.isConnected) {
        this.captureShot();
      }
    }, intervalMs);
  }

  public stopAutoCapture() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public isAutoCapturing(): boolean {
    return this.timer !== null;
  }

  public captureShot(options: { forceRaw?: boolean; forceJpeg?: boolean } = {}): SimulatedShot {
    const pad = (n: number) => n.toString().padStart(4, '0');
    const index = this.shotCounter++;

    let isRaw = options.forceRaw ? true : options.forceJpeg ? false : index % 2 === 1;
    let ext = 'JPG';
    let rawFormat: SimulatedShot['rawFormat'] = 'JPEG';

    if (isRaw) {
      if (this.selectedProfile === 'Sony') {
        ext = 'ARW';
        rawFormat = 'ARW';
      } else if (this.selectedProfile === 'Canon') {
        ext = 'CR3';
        rawFormat = 'CR3';
      } else {
        ext = 'NEF';
        rawFormat = 'NEF';
      }
    }

    const fileName = `DSC_${pad(index)}.${ext}`;
    // Realistic file sizes: RAW ~35-50MB, JPEG ~8-14MB
    const fileSize = isRaw ? Math.floor(34 * 1024 * 1024 + Math.random() * 8 * 1024 * 1024) : Math.floor(7 * 1024 * 1024 + Math.random() * 4 * 1024 * 1024);

    const apertures = ['f/1.8', 'f/2.8', 'f/4.0', 'f/5.6'];
    const shutters = ['1/250s', '1/500s', '1/1000s', '1/160s'];
    const isos = [100, 200, 400, 800, 1600];
    const focals = ['24mm', '35mm', '50mm', '70mm'];

    const exif: ExifData = {
      make: this.selectedProfile,
      model: this.getCameraInfo().model,
      lens: this.getCameraInfo().brand === 'Sony' ? 'FE 24-70mm F2.8 GM II' : '24-70mm f/2.8',
      aperture: apertures[index % apertures.length],
      shutterSpeed: shutters[index % shutters.length],
      iso: isos[index % isos.length],
      focalLength: focals[index % focals.length],
      capturedAt: Date.now(),
      width: 7008,
      height: 4672,
    };

    const thumbnail = photoStorageManager.generatePlaceholderThumbnail(fileName, isRaw, rawFormat);

    const shot: SimulatedShot = {
      fileName,
      localPath: `file:///storage/emulated/0/DCIM/AeroShutter/${fileName}`,
      thumbnailPath: thumbnail,
      fileSize,
      mimeType: photoStorageManager.getMimeType(fileName),
      isRaw,
      rawFormat,
      exif,
      width: 7008,
      height: 4672,
    };

    if (this.onPhotoCallback) {
      this.onPhotoCallback(shot);
    }

    return shot;
  }
}

export const mockCameraService = MockCameraService.getInstance();

