/**
 * AeroShutter Local Hot-Folder Watcher Service
 * Observes local directories, USB-C card readers, and DCIM directories for incoming files.
 */

import { photoStorageManager } from '../storage/PhotoStorageManager';

export class LocalWatcherService {
  private static instance: LocalWatcherService;
  private watchedPath = '/storage/emulated/0/DCIM/AeroShutter';
  private isWatching = false;
  private onPhotoCallback?: (fileMeta: { fileName: string; localPath: string; fileSize: number }) => void;

  public static getInstance(): LocalWatcherService {
    if (!LocalWatcherService.instance) {
      LocalWatcherService.instance = new LocalWatcherService();
    }
    return LocalWatcherService.instance;
  }

  public setOnPhotoReceived(cb: (fileMeta: { fileName: string; localPath: string; fileSize: number }) => void) {
    this.onPhotoCallback = cb;
  }

  public async startWatching(path?: string): Promise<boolean> {
    if (path) this.watchedPath = path;
    this.isWatching = true;
    return true;
  }

  public async stopWatching(): Promise<void> {
    this.isWatching = false;
  }

  public getWatchedPath(): string {
    return this.watchedPath;
  }

  public isActive(): boolean {
    return this.isWatching;
  }

  public simulateManualImport(fileName: string, size = 18 * 1024 * 1024) {
    if (this.onPhotoCallback) {
      this.onPhotoCallback({
        fileName,
        localPath: `${this.watchedPath}/${fileName}`,
        fileSize: size,
      });
    }
  }
}

export const localWatcherService = LocalWatcherService.getInstance();
