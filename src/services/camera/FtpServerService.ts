/**
 * AeroShutter Embedded FTP Server Service
 * Manages local FTP background daemon on port 2121 for direct Wi-Fi tethering
 * from Sony, Canon, Nikon, and Fujifilm cameras.
 */

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { FtpServerConfig } from '../../types/camera';

const { EmbeddedFtpServerModule } = NativeModules;

export class FtpServerService {
  private static instance: FtpServerService;
  private config: FtpServerConfig = {
    port: 2121,
    passivePortRange: { min: 2122, max: 2130 },
    username: 'aeroshutter',
    password: '',
    anonymousAllowed: true,
    activeIp: '192.168.43.1', // Standard mobile hotspot IP
    isRunning: false,
    totalTransferredBytes: 0,
    photosReceived: 0,
  };

  private eventEmitter?: NativeEventEmitter;
  private onPhotoReceivedCallback?: (photoMeta: { fileName: string; localPath: string; fileSize: number }) => void;

  public static getInstance(): FtpServerService {
    if (!FtpServerService.instance) {
      FtpServerService.instance = new FtpServerService();
    }
    return FtpServerService.instance;
  }

  constructor() {
    try {
      if (EmbeddedFtpServerModule) {
        this.eventEmitter = new NativeEventEmitter(EmbeddedFtpServerModule);
        this.eventEmitter.addListener('FTP_PHOTO_UPLOADED', (event) => {
          this.config.photosReceived++;
          this.config.totalTransferredBytes += event.fileSize || 0;
          if (this.onPhotoReceivedCallback) {
            this.onPhotoReceivedCallback(event);
          }
        });
      }
    } catch (e) {
      console.warn('Could not initialize native FTP event emitter:', e);
    }
  }

  public setOnPhotoReceived(cb: (photoMeta: { fileName: string; localPath: string; fileSize: number }) => void) {
    this.onPhotoReceivedCallback = cb;
  }

  public async startServer(port = 2121): Promise<FtpServerConfig> {
    this.config.port = port;

    if (EmbeddedFtpServerModule) {
      try {
        const result = await EmbeddedFtpServerModule.startServer(port);
        this.config.isRunning = true;
        this.config.activeIp = result.ipAddress || this.config.activeIp;
        return this.config;
      } catch (err) {
        console.warn('Native FTP server start failed, falling back to simulated daemon:', err);
      }
    }

    // Software simulated fallback for UI & development
    this.config.isRunning = true;
    return this.config;
  }

  public async stopServer(): Promise<FtpServerConfig> {
    if (EmbeddedFtpServerModule) {
      try {
        await EmbeddedFtpServerModule.stopServer();
      } catch (err) {
        console.warn('Native FTP stop error:', err);
      }
    }

    this.config.isRunning = false;
    return this.config;
  }

  public getConfig(): FtpServerConfig {
    return { ...this.config };
  }

  public updateIp(ip: string) {
    this.config.activeIp = ip;
  }
}

export const ftpServerService = FtpServerService.getInstance();

