export interface GoogleDriveAccount {
  id: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  storageQuota?: {
    limitBytes: number;
    usageBytes: number;
    usageInDriveBytes: number;
    usageInTrashBytes: number;
  };
}

export interface DriveFolder {
  id: string;
  name: string;
  mimeType: 'application/vnd.google-apps.folder';
  parents?: string[];
  webViewLink?: string;
  createdTime?: string;
}

export interface ResumableUploadSession {
  uploadUri: string;
  totalBytes: number;
  bytesUploaded: number;
  isComplete: boolean;
  driveFileId?: string;
}

export interface DriveUploadProgress {
  taskId: string;
  bytesUploaded: number;
  totalBytes: number;
  percentage: number;
  speedBytesPerSecond: number;
}
