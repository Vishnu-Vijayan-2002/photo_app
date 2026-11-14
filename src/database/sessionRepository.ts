/**
 * AeroShutter Session Repository
 */

import { dbManager } from './database';
import { Session, CreateSessionDTO } from '../types/session';

export class SessionRepository {
  async createSession(dto: CreateSessionDTO): Promise<Session> {
    const db = dbManager.getDriver();
    const id = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const now = Date.now();

    // Check if there are existing sessions; if none, make this active
    const existing = await this.getAllSessions();
    const isActive = existing.length === 0 ? 1 : 0;

    await db.executeSql(
      `INSERT INTO sessions (id, name, description, drive_folder_id, drive_folder_url, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, dto.name, dto.description || '', dto.driveFolderId || '', dto.driveFolderUrl || '', isActive, now, now]
    );

    return {
      id,
      name: dto.name,
      description: dto.description,
      driveFolderId: dto.driveFolderId,
      driveFolderUrl: dto.driveFolderUrl,
      isActive: isActive === 1,
      totalPhotos: 0,
      uploadedPhotos: 0,
      failedPhotos: 0,
      pendingPhotos: 0,
      totalBytes: 0,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getSessionById(id: string): Promise<Session | null> {
    const db = dbManager.getDriver();
    const res = await db.executeSql('SELECT * FROM sessions WHERE id = ? LIMIT 1', [id]);
    if (res.rows.length === 0) return null;
    return this.mapRowToSession(res.rows[0]);
  }

  async getActiveSession(): Promise<Session | null> {
    const db = dbManager.getDriver();
    const res = await db.executeSql('SELECT * FROM sessions WHERE is_active = 1 LIMIT 1');
    if (res.rows.length === 0) {
      const all = await this.getAllSessions();
      return all.length > 0 ? all[0] : null;
    }
    return this.mapRowToSession(res.rows[0]);
  }

  async setActiveSession(id: string): Promise<void> {
    const db = dbManager.getDriver();
    await db.executeSql('UPDATE sessions SET is_active = 0 WHERE is_active = 1');
    await db.executeSql('UPDATE sessions SET is_active = 1 WHERE id = ?', [id]);
  }

  async getAllSessions(): Promise<Session[]> {
    const db = dbManager.getDriver();
    const res = await db.executeSql('SELECT * FROM sessions ORDER BY created_at DESC');
    return Promise.all(res.rows.map((r) => this.mapRowToSession(r)));
  }

  async updateDriveFolder(sessionId: string, folderId: string, folderUrl: string): Promise<void> {
    const db = dbManager.getDriver();
    const now = Date.now();
    await db.executeSql('UPDATE sessions SET drive_folder_id = ?, drive_folder_url = ?, updated_at = ? WHERE id = ?', [
      folderId,
      folderUrl,
      now,
      sessionId,
    ]);
  }

  async deleteSession(id: string): Promise<void> {
    const db = dbManager.getDriver();
    await db.executeSql('DELETE FROM sessions WHERE id = ?', [id]);
    await db.executeSql('DELETE FROM photos WHERE session_id = ?', [id]);
    await db.executeSql('DELETE FROM upload_queue WHERE session_id = ?', [id]);
  }

  private async mapRowToSession(row: any): Promise<Session> {
    const db = dbManager.getDriver();
    const photosRes = await db.executeSql('SELECT * FROM photos WHERE session_id = ?', [row.id]);
    const queueRes = await db.executeSql('SELECT * FROM upload_queue WHERE session_id = ?', [row.id]);

    const totalPhotos = photosRes.rows.length;
    const totalBytes = photosRes.rows.reduce((sum, p) => sum + (p.file_size || 0), 0);
    const uploadedPhotos = queueRes.rows.filter((q) => q.status === 'COMPLETED').length;
    const failedPhotos = queueRes.rows.filter((q) => q.status === 'FAILED').length;
    const pendingPhotos = queueRes.rows.filter((q) => q.status === 'PENDING' || q.status === 'UPLOADING').length;

    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      driveFolderId: row.drive_folder_id || '',
      driveFolderUrl: row.drive_folder_url || '',
      isActive: row.is_active === 1,
      totalPhotos,
      uploadedPhotos,
      failedPhotos,
      pendingPhotos,
      totalBytes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const sessionRepo = new SessionRepository();
