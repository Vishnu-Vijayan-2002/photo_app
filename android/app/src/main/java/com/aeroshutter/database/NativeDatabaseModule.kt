package com.aeroshutter.database

import android.content.Context
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import com.facebook.react.bridge.*
import kotlinx.coroutines.*

class NativeDatabaseModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val dbHelper = TetherFlowDbHelper(reactContext)
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    override fun getName(): String = "NativeDatabaseModule"

    @ReactMethod
    fun executeSql(query: String, params: ReadableArray?, promise: Promise) {
        scope.launch {
            try {
                val db = dbHelper.writableDatabase
                val trimmed = query.trim()
                val isSelect = trimmed.startsWith("SELECT", ignoreCase = true) ||
                               trimmed.startsWith("PRAGMA", ignoreCase = true)

                if (isSelect) {
                    val args = if (params != null && params.size() > 0) {
                        Array(params.size()) { i ->
                            when (params.getType(i)) {
                                ReadableType.Null -> null
                                ReadableType.Boolean -> if (params.getBoolean(i)) "1" else "0"
                                ReadableType.Number -> {
                                    val num = params.getDouble(i)
                                    if (num == num.toLong().toDouble()) num.toLong().toString() else num.toString()
                                }
                                ReadableType.String -> params.getString(i)
                                else -> params.getString(i)
                            }
                        }
                    } else null

                    val cursor: Cursor = db.rawQuery(query, args)
                    val rowsArray = Arguments.createArray()
                    val columnCount = cursor.columnCount
                    val columnNames = cursor.columnNames

                    cursor.use { c ->
                        while (c.moveToNext()) {
                            val rowMap = Arguments.createMap()
                            for (i in 0 until columnCount) {
                                val colName = columnNames[i]
                                when (c.getType(i)) {
                                    Cursor.FIELD_TYPE_NULL -> rowMap.putNull(colName)
                                    Cursor.FIELD_TYPE_INTEGER -> rowMap.putDouble(colName, c.getLong(i).toDouble())
                                    Cursor.FIELD_TYPE_FLOAT -> rowMap.putDouble(colName, c.getDouble(i))
                                    Cursor.FIELD_TYPE_STRING -> rowMap.putString(colName, c.getString(i))
                                    Cursor.FIELD_TYPE_BLOB -> {
                                        val blob = c.getBlob(i)
                                        val b64 = android.util.Base64.encodeToString(blob, android.util.Base64.NO_WRAP)
                                        rowMap.putString(colName, b64)
                                    }
                                }
                            }
                            rowsArray.pushMap(rowMap)
                        }
                    }

                    val result = Arguments.createMap().apply {
                        putArray("rows", rowsArray)
                        putInt("rowsAffected", 0)
                    }
                    withContext(Dispatchers.Main) {
                        promise.resolve(result)
                    }
                } else {
                    // INSERT, UPDATE, DELETE, CREATE, DROP
                    val stmt = db.compileStatement(query)
                    if (params != null) {
                        for (i in 0 until params.size()) {
                            val bindIndex = i + 1
                            when (params.getType(i)) {
                                ReadableType.Null -> stmt.bindNull(bindIndex)
                                ReadableType.Boolean -> stmt.bindLong(bindIndex, if (params.getBoolean(i)) 1L else 0L)
                                ReadableType.Number -> stmt.bindDouble(bindIndex, params.getDouble(i))
                                ReadableType.String -> stmt.bindString(bindIndex, params.getString(i))
                                else -> stmt.bindString(bindIndex, params.getString(i) ?: "")
                            }
                        }
                    }

                    val isInsert = trimmed.startsWith("INSERT", ignoreCase = true) ||
                                   trimmed.startsWith("REPLACE", ignoreCase = true)

                    var insertId = -1L
                    var rowsAffected = 0

                    if (isInsert) {
                        insertId = stmt.executeInsert()
                        rowsAffected = if (insertId != -1L) 1 else 0
                    } else {
                        rowsAffected = stmt.executeUpdateDelete()
                    }
                    stmt.close()

                    val result = Arguments.createMap().apply {
                        putArray("rows", Arguments.createArray())
                        putInt("rowsAffected", rowsAffected)
                        if (insertId != -1L) {
                            putDouble("insertId", insertId.toDouble())
                        }
                    }
                    withContext(Dispatchers.Main) {
                        promise.resolve(result)
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    promise.reject("SQLITE_ERROR", e.message, e)
                }
            }
        }
    }

    private class TetherFlowDbHelper(context: Context) :
        SQLiteOpenHelper(context, "tetherflow.db", null, 1) {

        override fun onCreate(db: SQLiteDatabase) {
            db.execSQL("""
                CREATE TABLE IF NOT EXISTS sessions (
                    id TEXT PRIMARY KEY NOT NULL,
                    name TEXT NOT NULL,
                    description TEXT,
                    drive_folder_id TEXT,
                    drive_folder_url TEXT,
                    is_active INTEGER DEFAULT 0,
                    created_at INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL
                )
            """.trimIndent())

            db.execSQL("""
                CREATE TABLE IF NOT EXISTS photos (
                    id TEXT PRIMARY KEY NOT NULL,
                    session_id TEXT NOT NULL,
                    file_name TEXT NOT NULL,
                    local_path TEXT NOT NULL,
                    thumbnail_path TEXT,
                    file_size INTEGER NOT NULL,
                    mime_type TEXT NOT NULL,
                    is_raw INTEGER DEFAULT 0,
                    raw_format TEXT,
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
                    created_at INTEGER NOT NULL
                )
            """.trimIndent())

            db.execSQL("""
                CREATE TABLE IF NOT EXISTS upload_queue (
                    id TEXT PRIMARY KEY NOT NULL,
                    photo_id TEXT NOT NULL,
                    session_id TEXT NOT NULL,
                    file_name TEXT NOT NULL,
                    local_path TEXT NOT NULL,
                    file_size INTEGER NOT NULL,
                    mime_type TEXT NOT NULL,
                    drive_folder_id TEXT NOT NULL,
                    drive_file_id TEXT,
                    status TEXT DEFAULT 'PENDING',
                    progress_bytes INTEGER DEFAULT 0,
                    retry_count INTEGER DEFAULT 0,
                    max_retries INTEGER DEFAULT 5,
                    resumable_session_url TEXT,
                    error_message TEXT,
                    created_at INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL,
                    completed_at INTEGER
                )
            """.trimIndent())

            db.execSQL("CREATE INDEX IF NOT EXISTS idx_photos_session ON photos(session_id)")
            db.execSQL("CREATE INDEX IF NOT EXISTS idx_photos_created ON photos(created_at DESC)")
            db.execSQL("CREATE INDEX IF NOT EXISTS idx_upload_queue_status ON upload_queue(status)")
            db.execSQL("CREATE INDEX IF NOT EXISTS idx_upload_queue_session ON upload_queue(session_id)")
        }

        override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
            // Future schema migrations
        }
    }
}

