import { ExifData } from './camera';

export type RawFormat = 'ARW' | 'CR3' | 'NEF' | 'RAF' | 'DNG' | 'RW2' | 'JPEG' | 'UNKNOWN';

export interface Photo {
  id: string;
  sessionId: string;
  fileName: string;
  localPath: string;
  thumbnailPath?: string;
  fileSize: number; // bytes
  mimeType: string;
  isRaw: boolean;
  rawFormat: RawFormat;
  width?: number;
  height?: number;
  exif?: ExifData;
  createdAt: number;
  uploadStatus?: 'PENDING' | 'UPLOADING' | 'COMPLETED' | 'FAILED' | 'PAUSED';
  uploadProgress?: number; // 0-100
  driveFileId?: string;
}

export interface PhotoFilter {
  sessionId?: string;
  isRawOnly?: boolean;
  isJpegOnly?: boolean;
  uploadStatus?: 'ALL' | 'PENDING' | 'UPLOADING' | 'COMPLETED' | 'FAILED';
  searchQuery?: string;
}
