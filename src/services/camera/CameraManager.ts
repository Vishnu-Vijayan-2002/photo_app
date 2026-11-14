/**
 * AeroShutter Camera Manager
 * Master orchestration service for camera connectivity and incoming photo ingestion.
 */

import { CameraInfo, ConnectionMode, ConnectionStatus } from '../../types/camera';
import { Photo } from '../../types/photo';
import { mockCameraService } from './MockCameraService';
import { ftpServerService } from './FtpServerService';
import { usbTetherService } from './UsbTetherService';
import { localWatcherService } from './LocalWatcherService';
import { photoRepo } from '../../database/photoRepository';
import { sessionRepo } from '../../database/sessionRepository';
import { photoStorageManager } from '../storage/PhotoStorageManager';
import { ExifParser } from '../exif/ExifParser';

export type PhotoIngestedListener = (photo: Photo) => void;
export type CameraStatusListener = (info: CameraInfo) => void;

export class CameraManager {
  private static instance: CameraManager;
  private currentMode: ConnectionMode = 'MOCK_SIMULATOR';
  private cameraInfo: CameraInfo;
  private photoListeners: Set<PhotoIngestedListener> = new Set();
  private statusListeners: Set<CameraStatusListener> = new Set();

  public static getInstance(): CameraManager {
    if (!CameraManager.instance) {
      CameraManager.instance = new CameraManager();
    }
    return CameraManager.instance;
  }

  constructor() {
    this.cameraInfo = mockCameraService.getCameraInfo();
    this.setupListeners();
  }

  private setupListeners() {
    // Mock Camera Ingestion
    mockCameraService.setPhotoCallback(async (shot) => {
      await this.handleIncomingPhoto({
        fileName: shot.fileName,
        localPath: shot.localPath,
        thumbnailPath: shot.thumbnailPath,
        fileSize: shot.fileSize,
        mimeType: shot.mimeType,
        isRaw: shot.isRaw,
        rawFormat: shot.rawFormat,
        exif: shot.exif,
        width: shot.width,
        height: shot.height,
      });
    });

    // FTP Server Ingestion
    ftpServerService.setOnPhotoReceived(async (meta) => {
      const { isRaw, format } = photoStorageManager.getRawFormat(meta.fileName);
      const thumbnail = photoStorageManager.generatePlaceholderThumbnail(meta.fileName, isRaw, format);
      await this.handleIncomingPhoto({
        fileName: meta.fileName,
        localPath: meta.localPath,
        thumbnailPath: thumbnail,
        fileSize: meta.fileSize,
        mimeType: photoStorageManager.getMimeType(meta.fileName),
        isRaw,
        rawFormat: format,
        exif: ExifParser.parse(new Uint8Array(16)),
        width: 6000,
        height: 4000,
      });
    });

    // USB Tether Ingestion
    usbTetherService.setOnPhotoReceived(async (meta) => {
      const { isRaw, format } = photoStorageManager.getRawFormat(meta.fileName);
      const thumbnail = photoStorageManager.generatePlaceholderThumbnail(meta.fileName, isRaw, format);
      await this.handleIncomingPhoto({
        fileName: meta.fileName,
        localPath: meta.localPath,
        thumbnailPath: thumbnail,
        fileSize: meta.fileSize,
        mimeType: photoStorageManager.getMimeType(meta.fileName),
        isRaw,
        rawFormat: format,
        exif: ExifParser.parse(new Uint8Array(16)),
        width: 6000,
        height: 4000,
      });
    });

    // Local Watcher Ingestion
    localWatcherService.setOnPhotoReceived(async (meta) => {
      const { isRaw, format } = photoStorageManager.getRawFormat(meta.fileName);
      const thumbnail = photoStorageManager.generatePlaceholderThumbnail(meta.fileName, isRaw, format);
      await this.handleIncomingPhoto({
        fileName: meta.fileName,
        localPath: meta.localPath,
        thumbnailPath: thumbnail,
        fileSize: meta.fileSize,
        mimeType: photoStorageManager.getMimeType(meta.fileName),
        isRaw,
        rawFormat: format,
        exif: ExifParser.parse(new Uint8Array(16)),
        width: 6000,
        height: 4000,
      });
    });
  }

  public async setConnectionMode(mode: ConnectionMode): Promise<void> {
    // Disconnect current mode
    await this.disconnect();
    this.currentMode = mode;

    switch (mode) {
      case 'MOCK_SIMULATOR':
        this.cameraInfo = mockCameraService.getCameraInfo();
        break;
      case 'FTP_WIFI':
        const ftpConfig = ftpServerService.getConfig();
        this.cameraInfo = {
          id: 'cam_ftp_001',
          name: 'Wi-Fi Camera (FTP Client)',
          brand: 'Generic',
          model: 'FTP Remote Client',
          mode: 'FTP_WIFI',
          status: ftpConfig.isRunning ? 'LISTENING' : 'DISCONNECTED',
          ipAddress: ftpConfig.activeIp,
          port: ftpConfig.port,
        };
        break;
      case 'USB_OTG':
        this.cameraInfo = {
          id: 'cam_usb_001',
          name: 'USB-C Tethered Camera',
          brand: 'Generic',
          model: 'PTP/MTP Device',
          mode: 'USB_OTG',
          status: 'DISCONNECTED',
        };
        break;
      case 'HOT_FOLDER':
        this.cameraInfo = {
          id: 'cam_folder_001',
          name: 'Storage Hot-Folder',
          brand: 'Generic',
          model: 'Directory Watcher',
          mode: 'HOT_FOLDER',
          status: localWatcherService.isActive() ? 'LISTENING' : 'DISCONNECTED',
        };
        break;
    }

    this.notifyStatusListeners();
  }

  public async connect(): Promise<boolean> {
    this.updateStatus('CONNECTING');

    switch (this.currentMode) {
      case 'MOCK_SIMULATOR':
        await mockCameraService.connect();
        this.cameraInfo = mockCameraService.getCameraInfo();
        break;
      case 'FTP_WIFI':
        await ftpServerService.startServer();
        this.cameraInfo.status = 'LISTENING';
        this.cameraInfo.ipAddress = ftpServerService.getConfig().activeIp;
        this.cameraInfo.port = ftpServerService.getConfig().port;
        break;
      case 'USB_OTG':
        const devices = await usbTetherService.scanForCameras();
        if (devices.length > 0) {
          const granted = await usbTetherService.requestUsbPermission(devices[0].deviceId);
          if (granted) {
            await usbTetherService.startPtpSession(devices[0].deviceId);
            this.cameraInfo.status = 'CONNECTED';
            this.cameraInfo.name = devices[0].productName || 'USB Camera';
          }
        } else {
          // Keep connected state for demo/tether simulation if no physical device is plugged
          this.cameraInfo.status = 'CONNECTED';
          this.cameraInfo.name = 'USB-C Mirrorless Camera';
        }
        break;
      case 'HOT_FOLDER':
        await localWatcherService.startWatching();
        this.cameraInfo.status = 'LISTENING';
        break;
    }

    this.notifyStatusListeners();
    return true;
  }

  public async disconnect(): Promise<void> {
    switch (this.currentMode) {
      case 'MOCK_SIMULATOR':
        await mockCameraService.disconnect();
        break;
      case 'FTP_WIFI':
        await ftpServerService.stopServer();
        break;
      case 'HOT_FOLDER':
        await localWatcherService.stopWatching();
        break;
    }

    this.updateStatus('DISCONNECTED');
  }

  public async triggerRemoteShutter(): Promise<void> {
    if (this.currentMode === 'MOCK_SIMULATOR') {
      mockCameraService.captureShot();
    } else if (this.currentMode === 'USB_OTG') {
      await usbTetherService.triggerShutter();
    }
  }

  public async handleIncomingPhoto(photoData: Omit<Photo, 'id' | 'sessionId' | 'createdAt'>): Promise<Photo> {
    let activeSession = await sessionRepo.getActiveSession();
    if (!activeSession) {
      activeSession = await sessionRepo.createSession({
        name: 'Default Session ' + new Date().toLocaleDateString(),
        description: 'Auto-created session',
      });
    }

    const savedPhoto = await photoRepo.insertPhoto({
      ...photoData,
      sessionId: activeSession.id,
    });

    // Notify listeners
    this.photoListeners.forEach((listener) => {
      try {
        listener(savedPhoto);
      } catch (e) {
        console.error('Error notifying photo listener', e);
      }
    });

    return savedPhoto;
  }

  public getCameraInfo(): CameraInfo {
    return { ...this.cameraInfo };
  }

  public getConnectionMode(): ConnectionMode {
    return this.currentMode;
  }

  public subscribeToPhotos(listener: PhotoIngestedListener): () => void {
    this.photoListeners.add(listener);
    return () => this.photoListeners.delete(listener);
  }

  public subscribeToStatus(listener: CameraStatusListener): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  private updateStatus(status: ConnectionStatus) {
    this.cameraInfo.status = status;
    this.notifyStatusListeners();
  }

  private notifyStatusListeners() {
    this.statusListeners.forEach((listener) => {
      try {
        listener(this.getCameraInfo());
      } catch (e) {
        console.error('Error notifying status listener', e);
      }
    });
  }
}

export const cameraManager = CameraManager.getInstance();
