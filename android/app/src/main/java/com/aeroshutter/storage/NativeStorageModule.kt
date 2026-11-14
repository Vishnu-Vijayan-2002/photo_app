package com.aeroshutter.storage

import android.content.ContentValues
import android.content.Context
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import com.facebook.react.bridge.*
import java.io.File
import java.io.FileInputStream

class NativeStorageModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "NativeStorageModule"

    @ReactMethod
    fun getStorageMetrics(promise: Promise) {
        try {
            val photosDir = File(reactContext.getExternalFilesDir(null), "Photos")
            var totalSize = 0L
            var fileCount = 0

            if (photosDir.exists()) {
                photosDir.listFiles()?.forEach { file ->
                    if (file.isFile) {
                        totalSize += file.length()
                        fileCount++
                    }
                }
            }

            val map = Arguments.createMap().apply {
                putDouble("totalBytes", totalSize.toDouble())
                putInt("photoCount", fileCount)
                putString("storagePath", photosDir.absolutePath)
            }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("STORAGE_ERROR", e.message)
        }
    }

    @ReactMethod
    fun exportToGallery(filePath: String, promise: Promise) {
        try {
            val srcFile = File(filePath.replace("file://", ""))
            if (!srcFile.exists()) {
                promise.reject("FILE_NOT_FOUND", "Source photo does not exist")
                return
            }

            MediaScannerConnection.scanFile(
                reactContext,
                arrayOf(srcFile.absolutePath),
                null
            ) { _, uri ->
                promise.resolve(uri?.toString() ?: "")
            }
        } catch (e: Exception) {
            promise.reject("EXPORT_ERROR", e.message)
        }
    }
}
