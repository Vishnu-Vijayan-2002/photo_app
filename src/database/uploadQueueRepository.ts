/**
 * AeroShutter Upload Queue Repository
 */

import { dbManager } from './database';
import { UploadTask, UploadStatus } from '../types/upload';

export class UploadQueueRepository {
  async enqueue(task: Omit<UploadTask, 'id' | 'createdAt' | 'updatedAt' | 'progressPercentage'>): Promise<UploadTask> {
    const db = dbManager.getDriver();
    const id = 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const now = Date.now();

    await db.executeSql(
      `INSERT INTO upload_queue (
        id, photo_id, session_id, file_name, local_path, file_size, mime_type,
        drive_folder_id, drive_file_id, status, progress_bytes, retry_count,
        max_retries, resumable_session_url, error_message, created_at, updated_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        task.photoId,
        task.sessionId,
        task.fileName,
        task.localPath,
        task.fileSize,
        task.mimeType,
        task.driveFolderId,
        task.driveFileId || '',
        task.status || 'PENDING',
        task.progressBytes || 0,
        task.retryCount || 0,
        task.maxRetries || 5,
        task.resumableSessionUrl || '',
        task.errorMessage || '',
        now,
        now,
        task.completedAt || null,
      ]
    );

    return {
      ...task,
      id,
      progressPercentage: task.fileSize > 0 ? Math.round((task.progressBytes / task.fileSize) * 100) : 0,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getPendingTasks(limit = 10): Promise<UploadTask[]> {
    const db = dbManager.getDriver();
    try {
      await db.executeSql("UPDATE upload_queue SET status = 'PENDING' WHERE status = '0' OR status = 0");
    } catch {}
    const res = await db.executeSql(
      'SELECT * FROM upload_queue WHERE status = ? OR status = ? ORDER BY created_at ASC LIMIT ?',
      ['PENDING', 'UPLOADING', limit]
    );
    return res.rows.map(this.mapRowToTask);
  }

  async getAllTasks(sessionId?: string): Promise<UploadTask[]> {
    const db = dbManager.getDriver();
    let query = 'SELECT * FROM upload_queue';
    const params: any[] = [];
    if (sessionId) {
      query += ' WHERE session_id = ?';
      params.push(sessionId);
    }
    query += ' ORDER BY created_at DESC';

    const res = await db.executeSql(query, params);
    return res.rows.map(this.mapRowToTask);
  }

  async getTaskById(id: string): Promise<UploadTask | null> {
    const db = dbManager.getDriver();
    const res = await db.executeSql('SELECT * FROM upload_queue WHERE id = ? LIMIT 1', [id]);
    if (res.rows.length === 0) return null;
    return this.mapRowToTask(res.rows[0]);
  }

  async getTaskByPhotoId(photoId: string): Promise<UploadTask | null> {
    const db = dbManager.getDriver();
    const res = await db.executeSql('SELECT * FROM upload_queue WHERE photo_id = ? LIMIT 1', [photoId]);
    if (res.rows.length === 0) return null;
    return this.mapRowToTask(res.rows[0]);
  }

  async updateProgress(id: string, progressBytes: number): Promise<void> {
    const db = dbManager.getDriver();
    await db.executeSql('UPDATE upload_queue SET progress_bytes = ?, status = ?, updated_at = ? WHERE id = ?', [
      progressBytes,
      'UPLOADING',
      Date.now(),
      id,
    ]);
  }

  async updateTaskPending(id: string, progressBytes: number, retryCount: number): Promise<void> {
    const db = dbManager.getDriver();
    await db.executeSql(
      'UPDATE upload_queue SET status = ?, progress_bytes = ?, retry_count = ?, updated_at = ? WHERE id = ?',
      ['PENDING', progressBytes, retryCount, Date.now(), id]
    );
  }

  async markCompleted(id: string, driveFileId: string): Promise<void> {
    const db = dbManager.getDriver();
    const now = Date.now();
    await db.executeSql(
      'UPDATE upload_queue SET status = ?, drive_file_id = ?, completed_at = ?, updated_at = ? WHERE id = ?',
      ['COMPLETED', driveFileId, now, now, id]
    );
  }

  async markFailed(id: string, errorMessage: string): Promise<void> {
    const db = dbManager.getDriver();
    const task = await this.getTaskById(id);
    const retryCount = (task?.retryCount || 0) + 1;
    const now = Date.now();
    await db.executeSql(
      'UPDATE upload_queue SET status = ?, error_message = ?, retry_count = ?, updated_at = ? WHERE id = ?',
      ['FAILED', errorMessage, retryCount, now, id]
    );
  }

  async setResumableSessionUrl(id: string, url: string): Promise<void> {
    const db = dbManager.getDriver();
    await db.executeSql('UPDATE upload_queue SET resumable_session_url = ?, updated_at = ? WHERE id = ?', [
      url,
      Date.now(),
      id,
    ]);
  }

  async retryTask(id: string): Promise<void> {
    const db = dbManager.getDriver();
    await db.executeSql(
      'UPDATE upload_queue SET status = ?, error_message = NULL, progress_bytes = 0, updated_at = ? WHERE id = ?',
      ['PENDING', Date.now(), id]
    );
  }

  async retryAllFailed(): Promise<void> {
    const db = dbManager.getDriver();
    await db.executeSql(
      'UPDATE upload_queue SET status = ?, error_message = NULL, updated_at = ? WHERE status = ?',
      ['PENDING', Date.now(), 'FAILED']
    );
  }

  async pauseAll(): Promise<void> {
    const db = dbManager.getDriver();
    await db.executeSql(
      'UPDATE upload_queue SET status = ?, updated_at = ? WHERE status = ? OR status = ?',
      ['PAUSED', Date.now(), 'PENDING', 'UPLOADING']
    );
  }

  async resumeAll(): Promise<void> {
    const db = dbManager.getDriver();
    await db.executeSql(
      'UPDATE upload_queue SET status = ?, updated_at = ? WHERE status = ?',
      ['PENDING', Date.now(), 'PAUSED']
    );
  }

  private mapRowToTask(row: any): UploadTask {
    const totalBytes = row.file_size || 0;
    const progressBytes = row.progress_bytes || 0;
    const progressPercentage = totalBytes > 0 ? Math.min(100, Math.round((progressBytes / totalBytes) * 100)) : 0;
    let status = row.status as UploadStatus;
    if (status === ('0' as any) || (status as any) === 0 || !status) {
      status = 'PENDING';
    }

    return {
      id: row.id,
      photoId: row.photo_id,
      sessionId: row.session_id,
      fileName: row.file_name,
      localPath: row.local_path,
      fileSize: totalBytes,
      mimeType: row.mime_type,
      driveFolderId: row.drive_folder_id,
      driveFileId: row.drive_file_id || undefined,
      status,
      progressBytes,
      progressPercentage,
      retryCount: row.retry_count || 0,
      maxRetries: row.max_retries || 5,
      resumableSessionUrl: row.resumable_session_url || undefined,
      errorMessage: row.error_message || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      completedAt: row.completed_at || undefined,
    };
  }
}

export const uploadQueueRepo = new UploadQueueRepository();

