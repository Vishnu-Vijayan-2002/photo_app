/**
 * AeroShutter Upload Queue Manager
 * Coordinates background cloud uploads, concurrency limits, speed metrics, and retries.
 * Implements 3 Flexible Modes:
 *   1. AUTO_CONTINUOUS: Automatic real-time upload on capture.
 *   2. MANUAL_SELECT: Manual gallery multi-selection and 1-tap upload.
 *   3. PRESET_MODE: Pre-configured preset workflow (RAW only, Graded JPEG, Dual Transfer).
 */

import { UploadTask, UploadQueueState, UploadSpeedMetrics, UploadMode, UploadPresetConfig } from '../../types/upload';
import { Photo } from '../../types/photo';
import { uploadQueueRepo } from '../../database/uploadQueueRepository';
import { sessionRepo } from '../../database/sessionRepository';
import { resumableUploader } from '../cloud/ResumableUploader';
import { googleDriveService } from '../cloud/GoogleDriveService';
import { googleAuthService } from '../cloud/GoogleAuthService';
import { networkMonitor } from './NetworkMonitor';
import { cameraManager } from '../camera/CameraManager';

export class UploadQueueManager {
  private static instance: UploadQueueManager;
  private isProcessing = false;
  private isPaused = false;
  private wifiOnly = false;
  private maxConcurrency = 2;
  private currentMode: UploadMode = 'AUTO_CONTINUOUS';
  private presetConfig: UploadPresetConfig = {
    targetFolderPattern: 'SESSION_NAME',
    transferWorkflow: 'DUAL_TRANSFER',
    selectedPresetId: 'portra-400',
    wifiOnly: false,
    maxConcurrency: 2,
    autoCreateSessionFolder: true,
    deleteLocalAfterUpload: false,
  };

  private activeTasks: Map<string, UploadTask> = new Map();
  private speedMetrics: UploadSpeedMetrics = {
    currentBytesPerSecond: 0,
    averageBytesPerSecond: 0,
    activeUploadsCount: 0,
    estimatedRemainingSeconds: 0,
  };
  private lastTransferredBytes = 0;
  private lastSpeedCheckTime = Date.now();
  private listeners: Set<(state: UploadQueueState) => void> = new Set();

  public static getInstance(): UploadQueueManager {
    if (!UploadQueueManager.instance) {
      UploadQueueManager.instance = new UploadQueueManager();
    }
    return UploadQueueManager.instance;
  }

  constructor() {
    this.setupListeners();
  }

  private setupListeners() {
    // Ingest newly captured photos immediately into the upload queue
    cameraManager.subscribeToPhotos(async (photo: Photo) => {
      try {
        if (this.currentMode === 'PRESET_MODE') {
          await this.enqueuePresetPhoto(photo);
        } else {
          // Immediately enqueue and process upload
          await this.enqueuePhoto(photo);
        }
      } catch (err) {
        console.error('Failed to auto-enqueue captured photo:', err);
      }
    });

    // Auto-resume queue when Google Account becomes authenticated
    googleAuthService.subscribe((acc) => {
      if (acc && acc.accessToken) {
        this.processQueue();
      }
    });

    // Monitor network changes
    networkMonitor.subscribe((net) => {
      const activeWifiOnly = this.currentMode === 'PRESET_MODE' ? this.presetConfig.wifiOnly : this.wifiOnly;
      if (!net.isConnected) {
        this.pause();
      } else if (activeWifiOnly && !net.isWifi) {
        this.pause();
      } else if (this.isPaused) {
        this.resume();
      }
    });

    // Speed calculation ticker
    setInterval(() => {
      this.calculateSpeedMetrics();
    }, 1000);
  }

  public getUploadMode(): UploadMode {
    return this.currentMode;
  }

  public setUploadMode(mode: UploadMode): void {
    this.currentMode = mode;
    this.notify();
  }

  public getPresetConfig(): UploadPresetConfig {
    return { ...this.presetConfig };
  }

  public updatePresetConfig(config: Partial<UploadPresetConfig>): void {
    this.presetConfig = { ...this.presetConfig, ...config };
    if (config.maxConcurrency !== undefined) {
      this.maxConcurrency = config.maxConcurrency;
    }
    this.notify();
  }

  /**
   * Mode 3: Preset Workflow Enqueue
   */
  public async enqueuePresetPhoto(photo: Photo): Promise<void> {
    const workflow = this.presetConfig.transferWorkflow;

    if (workflow === 'RAW_ONLY') {
      await this.enqueuePhoto(photo);
    } else if (workflow === 'GRADED_ONLY') {
      const gradedFileName = photo.fileName.replace(/\.[^/.]+$/, '') + `_${this.presetConfig.selectedPresetId}.jpg`;
      await this.enqueuePhoto({
        ...photo,
        id: photo.id + '_graded',
        fileName: gradedFileName,
        mimeType: 'image/jpeg',
      });
    } else if (workflow === 'DUAL_TRANSFER') {
      // Dual Upload: Both original RAW and Graded JPEG
      await this.enqueuePhoto(photo);
      const gradedFileName = photo.fileName.replace(/\.[^/.]+$/, '') + `_${this.presetConfig.selectedPresetId}.jpg`;
      await this.enqueuePhoto({
        ...photo,
        id: photo.id + '_graded',
        fileName: gradedFileName,
        mimeType: 'image/jpeg',
      });
    }
  }

  /**
   * Mode 2: Manual Selection Enqueue
   */
  public async enqueueSelectedPhotos(photos: Photo[]): Promise<UploadTask[]> {
    const tasks: UploadTask[] = [];
    for (const photo of photos) {
      const task = await this.enqueuePhoto(photo);
      tasks.push(task);
    }
    this.processQueue();
    return tasks;
  }

  public async enqueuePhoto(photo: Photo): Promise<UploadTask> {
    const session = await sessionRepo.getSessionById(photo.sessionId);
    let driveFolderId = session?.driveFolderId;

    if (!driveFolderId) {
      if (googleAuthService.isAuthenticated()) {
        try {
          const folderName = session?.name || 'Studio Session';
          const folder = await googleDriveService.createSessionFolder(folderName);
          driveFolderId = folder.id;
          if (session) {
            await sessionRepo.updateDriveFolder(session.id, folder.id, folder.webViewLink || '');
          }
        } catch {
          driveFolderId = 'gdir_session_' + (session?.id || 'default');
        }
      } else {
        driveFolderId = 'gdir_session_' + (session?.id || 'default');
      }
    }

    const task = await uploadQueueRepo.enqueue({
      photoId: photo.id,
      sessionId: photo.sessionId,
      fileName: photo.fileName,
      localPath: photo.localPath,
      fileSize: photo.fileSize,
      mimeType: photo.mimeType,
      driveFolderId,
      status: 'PENDING',
      progressBytes: 0,
      retryCount: 0,
      maxRetries: 5,
    });

    this.notify();
    this.processQueue();
    return task;
  }

  public async processQueue(): Promise<void> {
    if (this.isProcessing || this.isPaused) return;

    if (!googleAuthService.isAuthenticated()) {
      return;
    }

    const net = networkMonitor.getState();
    const activeWifiOnly = this.currentMode === 'PRESET_MODE' ? this.presetConfig.wifiOnly : this.wifiOnly;
    if (!net.isConnected || (activeWifiOnly && !net.isWifi)) {
      return;
    }

    this.isProcessing = true;

    try {
      while (!this.isPaused && this.activeTasks.size < this.maxConcurrency) {
        const pending = await uploadQueueRepo.getPendingTasks(1);
        if (pending.length === 0) break;

        const candidate = pending[0];
        if (this.activeTasks.has(candidate.id)) break;

        // If candidate's driveFolderId is a deferred placeholder, resolve it now with the live Google Account
        if (candidate.driveFolderId.startsWith('gdir_')) {
          try {
            const session = await sessionRepo.getSessionById(candidate.sessionId);
            let folderId = session?.driveFolderId;
            if (!folderId || folderId.startsWith('gdir_')) {
              const folder = await googleDriveService.createSessionFolder(session?.name || 'Studio Session');
              folderId = folder.id;
              if (session) {
                await sessionRepo.updateDriveFolder(session.id, folder.id, folder.webViewLink || '');
              }
            }
            candidate.driveFolderId = folderId;
          } catch {
            // Proceed to upload
          }
        }

        this.startTaskUpload(candidate);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async startTaskUpload(task: UploadTask) {
    this.activeTasks.set(task.id, task);
    this.notify();

    try {
      let sessionUrl = task.resumableSessionUrl;
      if (!sessionUrl) {
        sessionUrl = await resumableUploader.initiateSession(task);
        await uploadQueueRepo.setResumableSessionUrl(task.id, sessionUrl);
        task.resumableSessionUrl = sessionUrl;
      }

      const result = await resumableUploader.upload(task, async (progress) => {
        task.progressBytes = progress.bytesUploaded;
        task.progressPercentage = progress.percentage;
        await uploadQueueRepo.updateProgress(task.id, progress.bytesUploaded);
        this.notify();
      });

      await uploadQueueRepo.markCompleted(task.id, result.driveFileId);

      // Refresh Google Drive storage quota in background after successful upload
      googleAuthService.refreshStorageQuota();
    } catch (error: any) {
      if (error?.message === 'UPLOAD_ABORTED') {
        task.status = 'PAUSED';
      } else {
        const nextRetry = task.retryCount + 1;
        if (nextRetry >= task.maxRetries) {
          await uploadQueueRepo.markFailed(task.id, error?.message || 'Upload failed');
        } else {
          task.retryCount = nextRetry;
          task.status = 'PENDING';
          await uploadQueueRepo.updateTaskPending(task.id, task.progressBytes, nextRetry);
        }
      }
    } finally {
      this.activeTasks.delete(task.id);
      this.notify();
      this.processQueue();
    }
  }

  public pause(): void {
    this.isPaused = true;
    for (const [taskId] of this.activeTasks) {
      resumableUploader.abortUpload(taskId);
    }
    this.activeTasks.clear();
    this.notify();
  }

  public resume(): void {
    this.isPaused = false;
    this.notify();
    this.processQueue();
  }

  public setWifiOnly(enabled: boolean): void {
    this.wifiOnly = enabled;
    this.notify();
  }

  public async retryTask(taskId: string): Promise<void> {
    await uploadQueueRepo.retryTask(taskId);
    this.notify();
    this.processQueue();
  }

  public async retryAllFailed(): Promise<void> {
    await uploadQueueRepo.retryAllFailed();
    this.notify();
    this.processQueue();
  }

  private calculateSpeedMetrics() {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastSpeedCheckTime) / 1000;
    if (elapsedSeconds <= 0) return;

    let currentTotalBytes = 0;
    for (const [, task] of this.activeTasks) {
      currentTotalBytes += task.progressBytes;
    }

    const deltaBytes = Math.max(0, currentTotalBytes - this.lastTransferredBytes);
    const instantSpeed = Math.round(deltaBytes / elapsedSeconds);

    this.speedMetrics.currentBytesPerSecond = instantSpeed;
    this.speedMetrics.averageBytesPerSecond = Math.round(
      this.speedMetrics.averageBytesPerSecond * 0.7 + instantSpeed * 0.3
    );
    this.speedMetrics.activeUploadsCount = this.activeTasks.size;

    this.lastTransferredBytes = currentTotalBytes;
    this.lastSpeedCheckTime = now;
  }

  public async getState(): Promise<UploadQueueState> {
    const allTasks = await uploadQueueRepo.getAllTasks();
    const pending = allTasks.filter((t) => t.status === 'PENDING' || t.status === 'UPLOADING');
    const completed = allTasks.filter((t) => t.status === 'COMPLETED');
    const failed = allTasks.filter((t) => t.status === 'FAILED');

    return {
      tasks: allTasks,
      isPaused: this.isPaused,
      activeConcurrency: this.activeTasks.size,
      maxConcurrency: this.maxConcurrency,
      metrics: { ...this.speedMetrics },
      totalPendingCount: pending.length,
      totalCompletedCount: completed.length,
      totalFailedCount: failed.length,
      currentMode: this.currentMode,
      presetConfig: { ...this.presetConfig },
    };
  }

  public subscribe(listener: (state: UploadQueueState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private async notify() {
    const state = await this.getState();
    this.listeners.forEach((l) => {
      try {
        l(state);
      } catch (e) {
        console.error('Error notifying queue listener', e);
      }
    });
  }
}

export const uploadQueueManager = UploadQueueManager.getInstance();
