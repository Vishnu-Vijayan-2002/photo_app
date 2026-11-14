/**
 * AeroShutter Upload Queue Manager
 * Coordinates background cloud uploads, concurrency limits, speed metrics, and retries.
 */

import { UploadTask, UploadQueueState, UploadSpeedMetrics } from '../../types/upload';
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
    // Automatically enqueue newly ingested photos
    cameraManager.subscribeToPhotos(async (photo: Photo) => {
      await this.enqueuePhoto(photo);
    });

    // Monitor network changes
    networkMonitor.subscribe((net) => {
      if (!net.isConnected) {
        this.pause();
      } else if (this.wifiOnly && !net.isWifi) {
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

  public async enqueuePhoto(photo: Photo): Promise<UploadTask> {
    const session = await sessionRepo.getSessionById(photo.sessionId);
    let driveFolderId = session?.driveFolderId;

    if (!driveFolderId) {
      const folder = await googleDriveService.createSessionFolder(session?.name || 'Shoot');
      driveFolderId = folder.id;
      if (session) {
        await sessionRepo.updateDriveFolder(session.id, folder.id, folder.webViewLink || '');
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
    if (!net.isConnected || (this.wifiOnly && !net.isWifi)) {
      return;
    }

    this.isProcessing = true;

    try {
      while (!this.isPaused && this.activeTasks.size < this.maxConcurrency) {
        const pending = await uploadQueueRepo.getPendingTasks(1);
        if (pending.length === 0) break;

        const candidate = pending[0];
        if (this.activeTasks.has(candidate.id)) break;

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
      task.status = 'COMPLETED';
      task.driveFileId = result.driveFileId;
    } catch (err: any) {
      console.warn('Upload error for task', task.id, err);
      const msg = err.message || 'Network upload failed';
      await uploadQueueRepo.markFailed(task.id, msg);
      task.status = 'FAILED';
      task.errorMessage = msg;
    } finally {
      this.activeTasks.delete(task.id);
      this.notify();
      this.processQueue();
    }
  }

  public pause(): void {
    this.isPaused = true;
    this.activeTasks.forEach((task) => {
      resumableUploader.abortUpload(task.id);
    });
    this.activeTasks.clear();
    uploadQueueRepo.pauseAll();
    this.notify();
  }

  public resume(): void {
    this.isPaused = false;
    uploadQueueRepo.resumeAll().then(() => {
      this.processQueue();
    });
    this.notify();
  }

  public setWifiOnly(enabled: boolean): void {
    this.wifiOnly = enabled;
    const net = networkMonitor.getState();
    if (this.wifiOnly && !net.isWifi) {
      this.pause();
    } else if (this.isPaused && (!this.wifiOnly || net.isWifi)) {
      this.resume();
    }
  }

  public isWifiOnly(): boolean {
    return this.wifiOnly;
  }

  public async retryAllFailed(): Promise<void> {
    await uploadQueueRepo.retryAllFailed();
    this.processQueue();
    this.notify();
  }

  public async retryTask(taskId: string): Promise<void> {
    await uploadQueueRepo.retryTask(taskId);
    this.processQueue();
    this.notify();
  }

  private calculateSpeedMetrics() {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastSpeedCheckTime) / 1000;

    let currentTotalBytes = 0;
    this.activeTasks.forEach((t) => {
      currentTotalBytes += t.progressBytes;
    });

    if (elapsedSeconds > 0) {
      const bytesDiff = Math.max(0, currentTotalBytes - this.lastTransferredBytes);
      const bps = bytesDiff / elapsedSeconds;
      this.speedMetrics.currentBytesPerSecond = Math.round(bps);
      this.speedMetrics.activeUploadsCount = this.activeTasks.size;
    }

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
