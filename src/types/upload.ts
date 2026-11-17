export type UploadStatus = 'PENDING' | 'UPLOADING' | 'COMPLETED' | 'FAILED' | 'PAUSED';

export type UploadMode = 'AUTO_CONTINUOUS' | 'MANUAL_SELECT' | 'PRESET_MODE';

export interface UploadPresetConfig {
  targetFolderPattern: 'SESSION_NAME' | 'DATE_SESSION' | 'CUSTOM';
  customFolderName?: string;
  transferWorkflow: 'RAW_ONLY' | 'GRADED_ONLY' | 'DUAL_TRANSFER';
  selectedPresetId: string;
  wifiOnly: boolean;
  maxConcurrency: number;
  autoCreateSessionFolder: boolean;
  deleteLocalAfterUpload: boolean;
}

export interface UploadTask {
  id: string;
  photoId: string;
  sessionId: string;
  fileName: string;
  localPath: string;
  fileSize: number;
  mimeType: string;
  driveFolderId: string;
  driveFileId?: string;
  status: UploadStatus;
  progressBytes: number;
  progressPercentage: number;
  retryCount: number;
  maxRetries: number;
  resumableSessionUrl?: string;
  errorMessage?: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

export interface UploadSpeedMetrics {
  currentBytesPerSecond: number;
  averageBytesPerSecond: number;
  activeUploadsCount: number;
  estimatedRemainingSeconds: number;
}

export interface UploadQueueState {
  tasks: UploadTask[];
  isPaused: boolean;
  activeConcurrency: number;
  maxConcurrency: number;
  metrics: UploadSpeedMetrics;
  totalPendingCount: number;
  totalCompletedCount: number;
  totalFailedCount: number;
  currentMode: UploadMode;
  presetConfig: UploadPresetConfig;
}

