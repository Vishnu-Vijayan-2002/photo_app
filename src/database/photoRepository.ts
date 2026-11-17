/**
 * AeroShutter Photo Repository
 */

import { dbManager } from './database';
import { Photo, PhotoFilter } from '../types/photo';

export class PhotoRepository {
  async insertPhoto(photo: Omit<Photo, 'id' | 'createdAt'>): Promise<Photo> {
    const db = dbManager.getDriver();
    const id = 'photo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const now = Date.now();

    await db.executeSql(
      `INSERT INTO photos (
        id, session_id, file_name, local_path, thumbnail_path, file_size, mime_type,
        is_raw, raw_format, width, height, exif_make, exif_model, exif_lens,
        exif_focal_length, exif_aperture, exif_shutter_speed, exif_iso, exif_captured_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        photo.sessionId,
        photo.fileName,
        photo.localPath,
        photo.thumbnailPath || '',
        photo.fileSize,
        photo.mimeType,
        photo.isRaw ? 1 : 0,
        photo.rawFormat,
        photo.width || 0,
        photo.height || 0,
        photo.exif?.make || '',
        photo.exif?.model || '',
        photo.exif?.lens || '',
        photo.exif?.focalLength || '',
        photo.exif?.aperture || '',
        photo.exif?.shutterSpeed || '',
        photo.exif?.iso || 0,
        photo.exif?.capturedAt || now,
        now,
      ]
    );

    return {
      ...photo,
      id,
      createdAt: now,
    };
  }

  async getPhotoById(id: string): Promise<Photo | null> {
    const db = dbManager.getDriver();
    const res = await db.executeSql('SELECT * FROM photos WHERE id = ? LIMIT 1', [id]);
    if (res.rows.length === 0) return null;
    return this.mapRowToPhoto(res.rows[0]);
  }

  async getPhotos(filter: PhotoFilter = {}): Promise<Photo[]> {
    const db = dbManager.getDriver();
    let query = 'SELECT * FROM photos';
    const conditions: string[] = [];
    const params: any[] = [];

    if (filter.sessionId) {
      conditions.push('session_id = ?');
      params.push(filter.sessionId);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const res = await db.executeSql(query, params);
    let photos = await Promise.all(res.rows.map((r) => this.mapRowToPhoto(r)));

    // Additional in-memory filters
    if (filter.isRawOnly) {
      photos = photos.filter((p) => p.isRaw);
    } else if (filter.isJpegOnly) {
      photos = photos.filter((p) => !p.isRaw);
    }

    if (filter.uploadStatus && filter.uploadStatus !== 'ALL') {
      photos = photos.filter((p) => p.uploadStatus === filter.uploadStatus);
    }

    if (filter.searchQuery && filter.searchQuery.trim().length > 0) {
      const q = filter.searchQuery.toLowerCase();
      photos = photos.filter(
        (p) =>
          p.fileName.toLowerCase().includes(q) ||
          p.exif?.model?.toLowerCase().includes(q) ||
          p.exif?.lens?.toLowerCase().includes(q)
      );
    }

    return photos;
  }

  async updatePhotoThumbnail(id: string, thumbnailPath: string): Promise<void> {
    const db = dbManager.getDriver();
    await db.executeSql('UPDATE photos SET thumbnail_path = ? WHERE id = ?', [thumbnailPath, id]);
  }

  async deletePhoto(id: string): Promise<void> {
    const db = dbManager.getDriver();
    await db.executeSql('DELETE FROM photos WHERE id = ?', [id]);
    await db.executeSql('DELETE FROM upload_queue WHERE photo_id = ?', [id]);
  }

  private async mapRowToPhoto(row: any): Promise<Photo> {
    const db = dbManager.getDriver();
    const queueRes = await db.executeSql('SELECT status, progress_bytes, file_size, drive_file_id FROM upload_queue WHERE photo_id = ? LIMIT 1', [row.id]);
    
    let uploadStatus: Photo['uploadStatus'] = undefined;
    let uploadProgress = 0;
    let driveFileId: string | undefined;

    if (queueRes.rows.length > 0) {
      const q = queueRes.rows[0];
      uploadStatus = q.status;
      uploadProgress = q.file_size > 0 ? Math.round((q.progress_bytes / q.file_size) * 100) : 0;
      driveFileId = q.drive_file_id || undefined;
    }

    return {
      id: row.id,
      sessionId: row.session_id,
      fileName: row.file_name,
      localPath: row.local_path,
      thumbnailPath: row.thumbnail_path || undefined,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      isRaw: row.is_raw === 1,
      rawFormat: row.raw_format,
      width: row.width,
      height: row.height,
      uploadStatus,
      uploadProgress,
      driveFileId,
      exif: {
        make: row.exif_make,
        model: row.exif_model,
        lens: row.exif_lens,
        focalLength: row.exif_focal_length,
        aperture: row.exif_aperture,
        shutterSpeed: row.exif_shutter_speed,
        iso: row.exif_iso,
        capturedAt: row.exif_captured_at,
        width: row.width,
        height: row.height,
      },
      createdAt: row.created_at,
    };
  }
}

export const photoRepo = new PhotoRepository();

