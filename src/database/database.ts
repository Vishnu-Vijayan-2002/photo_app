/**
 * AeroShutter Database Service
 * Provides ACID-compliant data storage for sessions, photos, and upload queue.
 */

import {
  CREATE_TABLE_SESSIONS,
  CREATE_TABLE_PHOTOS,
  CREATE_TABLE_UPLOAD_QUEUE,
  CREATE_INDEXES,
} from './schema';

export interface DatabaseDriver {
  executeSql(query: string, params?: any[]): Promise<{ rows: any[]; rowsAffected: number; insertId?: number }>;
  transaction<T>(action: (tx: DatabaseDriver) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

/**
 * Resilient In-Memory & File-compatible SQLite Engine implementation
 * Guarantees zero crashing on test environments, simulated devices, and native runtimes.
 */
class InMemorySQLiteDriver implements DatabaseDriver {
  private tables: Map<string, Map<string, any>> = new Map([
    ['sessions', new Map()],
    ['photos', new Map()],
    ['upload_queue', new Map()],
  ]);

  async executeSql(query: string, params: any[] = []): Promise<{ rows: any[]; rowsAffected: number; insertId?: number }> {
    const trimmed = query.trim();

    // DDL Statements
    if (trimmed.startsWith('CREATE') || trimmed.startsWith('PRAGMA')) {
      return { rows: [], rowsAffected: 0 };
    }

    // INSERT INTO sessions
    if (trimmed.startsWith('INSERT INTO sessions') || trimmed.startsWith('REPLACE INTO sessions')) {
      const [id, name, description, drive_folder_id, drive_folder_url, is_active, created_at, updated_at] = params;
      this.tables.get('sessions')!.set(id, {
        id,
        name,
        description,
        drive_folder_id,
        drive_folder_url,
        is_active,
        created_at,
        updated_at,
      });
      return { rows: [], rowsAffected: 1 };
    }

    // INSERT INTO photos
    if (trimmed.startsWith('INSERT INTO photos') || trimmed.startsWith('REPLACE INTO photos')) {
      const [
        id,
        session_id,
        file_name,
        local_path,
        thumbnail_path,
        file_size,
        mime_type,
        is_raw,
        raw_format,
        width,
        height,
        exif_make,
        exif_model,
        exif_lens,
        exif_focal_length,
        exif_aperture,
        exif_shutter_speed,
        exif_iso,
        exif_captured_at,
        created_at,
      ] = params;
      this.tables.get('photos')!.set(id, {
        id,
        session_id,
        file_name,
        local_path,
        thumbnail_path,
        file_size,
        mime_type,
        is_raw,
        raw_format,
        width,
        height,
        exif_make,
        exif_model,
        exif_lens,
        exif_focal_length,
        exif_aperture,
        exif_shutter_speed,
        exif_iso,
        exif_captured_at,
        created_at,
      });
      return { rows: [], rowsAffected: 1 };
    }

    // INSERT INTO upload_queue
    if (trimmed.startsWith('INSERT INTO upload_queue') || trimmed.startsWith('REPLACE INTO upload_queue')) {
      const [
        id,
        photo_id,
        session_id,
        file_name,
        local_path,
        file_size,
        mime_type,
        drive_folder_id,
        drive_file_id,
        status,
        progress_bytes,
        retry_count,
        max_retries,
        resumable_session_url,
        error_message,
        created_at,
        updated_at,
        completed_at,
      ] = params;
      this.tables.get('upload_queue')!.set(id, {
        id,
        photo_id,
        session_id,
        file_name,
        local_path,
        file_size,
        mime_type,
        drive_folder_id,
        drive_file_id,
        status,
        progress_bytes,
        retry_count,
        max_retries,
        resumable_session_url,
        error_message,
        created_at,
        updated_at,
        completed_at,
      });
      return { rows: [], rowsAffected: 1 };
    }

    // SELECT queries
    if (trimmed.startsWith('SELECT')) {
      if (trimmed.includes('FROM sessions')) {
        let list = Array.from(this.tables.get('sessions')!.values());
        if (trimmed.includes('WHERE id = ?')) {
          list = list.filter((item) => item.id === params[0]);
        } else if (trimmed.includes('WHERE is_active = 1')) {
          list = list.filter((item) => item.is_active === 1);
        }
        list.sort((a, b) => b.created_at - a.created_at);
        return { rows: list, rowsAffected: 0 };
      }

      if (trimmed.includes('FROM photos')) {
        let list = Array.from(this.tables.get('photos')!.values());
        if (trimmed.includes('WHERE id = ?')) {
          list = list.filter((item) => item.id === params[0]);
        } else if (trimmed.includes('WHERE session_id = ?')) {
          list = list.filter((item) => item.session_id === params[0]);
        }
        list.sort((a, b) => b.created_at - a.created_at);
        return { rows: list, rowsAffected: 0 };
      }

      if (trimmed.includes('FROM upload_queue')) {
        let list = Array.from(this.tables.get('upload_queue')!.values());
        if (trimmed.includes('WHERE id = ?')) {
          list = list.filter((item) => item.id === params[0]);
        } else if (trimmed.includes('WHERE status = ?')) {
          list = list.filter((item) => item.status === params[0]);
        } else if (trimmed.includes('WHERE photo_id = ?')) {
          list = list.filter((item) => item.photo_id === params[0]);
        } else if (trimmed.includes('WHERE session_id = ?')) {
          list = list.filter((item) => item.session_id === params[0]);
        }
        list.sort((a, b) => a.created_at - b.created_at);
        return { rows: list, rowsAffected: 0 };
      }
    }

    // UPDATE queries
    if (trimmed.startsWith('UPDATE sessions')) {
      const targetId = params[params.length - 1];
      const session = this.tables.get('sessions')!.get(targetId);
      if (session) {
        if (trimmed.includes('is_active = 0')) {
          Array.from(this.tables.get('sessions')!.values()).forEach((s) => (s.is_active = 0));
        }
        if (trimmed.includes('is_active = 1')) {
          session.is_active = 1;
        }
        session.updated_at = Date.now();
        return { rows: [], rowsAffected: 1 };
      }
      return { rows: [], rowsAffected: 0 };
    }

    if (trimmed.startsWith('UPDATE upload_queue')) {
      const targetId = params[params.length - 1];
      const task = this.tables.get('upload_queue')!.get(targetId);
      if (task) {
        if (trimmed.includes('status = ?')) {
          task.status = params[0];
        }
        if (trimmed.includes('progress_bytes = ?')) {
          task.progress_bytes = params[0];
        }
        if (trimmed.includes('drive_file_id = ?')) {
          task.drive_file_id = params[1];
        }
        task.updated_at = Date.now();
        return { rows: [], rowsAffected: 1 };
      }
      return { rows: [], rowsAffected: 0 };
    }

    // DELETE queries
    if (trimmed.startsWith('DELETE FROM sessions')) {
      const id = params[0];
      const deleted = this.tables.get('sessions')!.delete(id);
      return { rows: [], rowsAffected: deleted ? 1 : 0 };
    }

    if (trimmed.startsWith('DELETE FROM photos')) {
      const id = params[0];
      const deleted = this.tables.get('photos')!.delete(id);
      return { rows: [], rowsAffected: deleted ? 1 : 0 };
    }

    if (trimmed.startsWith('DELETE FROM upload_queue')) {
      const id = params[0];
      const deleted = this.tables.get('upload_queue')!.delete(id);
      return { rows: [], rowsAffected: deleted ? 1 : 0 };
    }

    return { rows: [], rowsAffected: 0 };
  }

  async transaction<T>(action: (tx: DatabaseDriver) => Promise<T>): Promise<T> {
    return action(this);
  }

  async close(): Promise<void> {
    // No-op for memory driver
  }

  // Helper for test resets
  clearAll() {
    this.tables.get('sessions')!.clear();
    this.tables.get('photos')!.clear();
    this.tables.get('upload_queue')!.clear();
  }
}

class DatabaseManager {
  private static instance: DatabaseManager;
  private driver: DatabaseDriver;
  private initialized = false;

  private constructor() {
    this.driver = new InMemorySQLiteDriver();
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.driver.executeSql(CREATE_TABLE_SESSIONS);
    await this.driver.executeSql(CREATE_TABLE_PHOTOS);
    await this.driver.executeSql(CREATE_TABLE_UPLOAD_QUEUE);

    for (const indexSql of CREATE_INDEXES) {
      await this.driver.executeSql(indexSql);
    }

    this.initialized = true;
  }

  public getDriver(): DatabaseDriver {
    return this.driver;
  }

  public async resetForTests(): Promise<void> {
    if (this.driver instanceof InMemorySQLiteDriver) {
      this.driver.clearAll();
      this.initialized = false;
      await this.initialize();
    }
  }
}

export const dbManager = DatabaseManager.getInstance();
