export interface Session {
  id: string;
  name: string;
  description?: string;
  driveFolderId?: string;
  driveFolderUrl?: string;
  isActive: boolean;
  totalPhotos: number;
  uploadedPhotos: number;
  failedPhotos: number;
  pendingPhotos: number;
  totalBytes: number;
  createdAt: number;
  updatedAt: number;
}

export interface CreateSessionDTO {
  name: string;
  description?: string;
  driveFolderId?: string;
  driveFolderUrl?: string;
}

export interface SessionStats {
  totalSessions: number;
  activeSessionId: string | null;
  totalPhotosCaptured: number;
  totalPhotosUploaded: number;
  totalStorageBytes: number;
}

