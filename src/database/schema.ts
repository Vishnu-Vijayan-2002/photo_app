/**
 * AeroShutter SQLite Database Schema
 */

export const SCHEMA_VERSION = 1;

export const CREATE_TABLE_SESSIONS = `
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  drive_folder_id TEXT,
  drive_folder_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
`;

export const CREATE_TABLE_PHOTOS = `
CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  local_path TEXT NOT NULL,
  thumbnail_path TEXT,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  is_raw INTEGER NOT NULL DEFAULT 0,
  raw_format TEXT NOT NULL DEFAULT 'JPEG',
  width INTEGER,
  height INTEGER,
  exif_make TEXT,
  exif_model TEXT,
  exif_lens TEXT,
  exif_focal_length TEXT,
  exif_aperture TEXT,
  exif_shutter_speed TEXT,
  exif_iso INTEGER,
  exif_captured_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
`;

export const CREATE_TABLE_UPLOAD_QUEUE = `
CREATE TABLE IF NOT EXISTS upload_queue (
  id TEXT PRIMARY KEY,
  photo_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  local_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  drive_folder_id TEXT NOT NULL,
  drive_file_id TEXT,
  status TEXT NOT NULL CHECK(status IN ('PENDING', 'UPLOADING', 'COMPLETED', 'FAILED', 'PAUSED')),
  progress_bytes INTEGER NOT NULL DEFAULT 0,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 5,
  resumable_session_url TEXT,
  error_message TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  completed_at INTEGER,
  FOREIGN KEY(photo_id) REFERENCES photos(id) ON DELETE CASCADE
);
`;

export const CREATE_INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_photos_session ON photos(session_id);',
  'CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at DESC);',
  'CREATE INDEX IF NOT EXISTS idx_queue_status ON upload_queue(status);',
  'CREATE INDEX IF NOT EXISTS idx_queue_photo_id ON upload_queue(photo_id);',
  'CREATE INDEX IF NOT EXISTS idx_queue_session_id ON upload_queue(session_id);',
];

