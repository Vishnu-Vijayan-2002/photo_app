package com.aeroshutter.storage

import android.content.ContentValues
import android.content.Context
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.ByteArrayInputStream
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL

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

    @ReactMethod
    fun uploadToGoogleDrive(params: ReadableMap, promise: Promise) {
        Thread {
            try {
                val uploadUrl = params.getString("uploadUrl") ?: throw IllegalArgumentException("uploadUrl is required")
                val filePath = if (params.hasKey("filePath")) params.getString("filePath") else null
                val base64Data = if (params.hasKey("base64Data")) params.getString("base64Data") else null
                val mimeType = if (params.hasKey("mimeType")) params.getString("mimeType") ?: "image/jpeg" else "image/jpeg"
                val taskId = if (params.hasKey("taskId")) params.getString("taskId") else ""

                val url = URL(uploadUrl)
                val connection = url.openConnection() as HttpURLConnection
                connection.requestMethod = "PUT"
                connection.doOutput = true
                connection.setConnectTimeout(45000)
                connection.setReadTimeout(90000)

                // Check if file exists on disk
                var file: File? = null
                if (!filePath.isNullOrEmpty()) {
                    val cleanPath = filePath.replace("file://", "")
                    val candidate = File(cleanPath)
                    if (candidate.exists() && candidate.isFile && candidate.length() > 0) {
                        file = candidate
                    }
                }

                val totalBytes: Long
                val inputStream: InputStream

                if (file != null) {
                    totalBytes = file.length()
                    inputStream = FileInputStream(file)
                } else if (!base64Data.isNullOrEmpty()) {
                    val rawBytes = android.util.Base64.decode(base64Data, android.util.Base64.DEFAULT)
                    totalBytes = rawBytes.size.toLong()
                    inputStream = ByteArrayInputStream(rawBytes)
                } else {
                    // Fallback minimal 1KB buffer
                    val dummy = ByteArray(1024)
                    totalBytes = dummy.size.toLong()
                    inputStream = ByteArrayInputStream(dummy)
                }

                connection.setRequestProperty("Content-Type", mimeType)
                connection.setRequestProperty("Content-Length", totalBytes.toString())
                connection.setFixedLengthStreamingMode(totalBytes)

                val outputStream = connection.outputStream
                val buffer = ByteArray(64 * 1024)
                var bytesRead: Int
                var uploadedBytes: Long = 0
                var lastProgressTime = System.currentTimeMillis()

                while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                    outputStream.write(buffer, 0, bytesRead)
                    uploadedBytes += bytesRead

                    val now = System.currentTimeMillis()
                    if (now - lastProgressTime >= 100 || uploadedBytes == totalBytes) {
                        lastProgressTime = now
                        val pct = if (totalBytes > 0) Math.min(100, Math.round((uploadedBytes.toDouble() / totalBytes.toDouble()) * 100)).toInt() else 0
                        val evt = Arguments.createMap().apply {
                            putString("taskId", taskId)
                            putDouble("bytesUploaded", uploadedBytes.toDouble())
                            putDouble("totalBytes", totalBytes.toDouble())
                            putInt("percentage", pct)
                        }
                        reactContext
                            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                            ?.emit("UploadProgress", evt)
                    }
                }
                outputStream.flush()
                outputStream.close()
                inputStream.close()

                val responseCode = connection.responseCode
                if (responseCode in 200..299) {
                    val resp = connection.inputStream.bufferedReader().use { it.readText() }
                    val map = Arguments.createMap().apply {
                        putInt("statusCode", responseCode)
                        putString("response", resp)
                    }
                    promise.resolve(map)
                } else {
                    val err = connection.errorStream?.bufferedReader()?.use { it.readText() } ?: "HTTP $responseCode"
                    promise.reject("UPLOAD_FAILED", "Google Drive PUT returned $responseCode: $err")
                }
                connection.disconnect()
            } catch (e: Exception) {
                promise.reject("UPLOAD_ERROR", e.message, e)
            }
        }.start()
    }

    @ReactMethod
    fun readFileBase64(filePath: String, promise: Promise) {
        try {
            val cleanPath = filePath.replace("file://", "")
            val file = File(cleanPath)
            if (!file.exists()) {
                promise.reject("FILE_NOT_FOUND", "File does not exist: $cleanPath")
                return
            }
            val bytes = file.readBytes()
            val base64 = android.util.Base64.encodeToString(bytes, android.util.Base64.NO_WRAP)
            promise.resolve(base64)
        } catch (e: Exception) {
            promise.reject("READ_ERROR", e.message)
        }
    }

    @ReactMethod
    fun setItem(key: String, value: String, promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences("aeroshutter_prefs", Context.MODE_PRIVATE)
            prefs.edit().putString(key, value).apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("PREFS_ERROR", e.message)
        }
    }

    @ReactMethod
    fun getItem(key: String, promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences("aeroshutter_prefs", Context.MODE_PRIVATE)
            val value = prefs.getString(key, null)
            promise.resolve(value)
        } catch (e: Exception) {
            promise.reject("PREFS_ERROR", e.message)
        }
    }

    @ReactMethod
    fun removeItem(key: String, promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences("aeroshutter_prefs", Context.MODE_PRIVATE)
            prefs.edit().remove(key).apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("PREFS_ERROR", e.message)
        }
    }

    private val KEY_ALIAS = "TetherFlowMasterSecureKey"
    private val ANDROID_KEYSTORE = "AndroidKeyStore"

    private fun getOrCreateSecretKey(): javax.crypto.SecretKey {
        val keyStore = java.security.KeyStore.getInstance(ANDROID_KEYSTORE).apply { load(null) }
        if (!keyStore.containsAlias(KEY_ALIAS)) {
            val keyGenerator = javax.crypto.KeyGenerator.getInstance(
                android.security.keystore.KeyProperties.KEY_ALGORITHM_AES,
                ANDROID_KEYSTORE
            )
            val builder = android.security.keystore.KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                android.security.keystore.KeyProperties.PURPOSE_ENCRYPT or android.security.keystore.KeyProperties.PURPOSE_DECRYPT
            )
                .setBlockModes(android.security.keystore.KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(android.security.keystore.KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
            keyGenerator.init(builder.build())
            return keyGenerator.generateKey()
        }
        val entry = keyStore.getEntry(KEY_ALIAS, null) as java.security.KeyStore.SecretKeyEntry
        return entry.secretKey
    }

    @ReactMethod
    fun setSecureItem(key: String, value: String, promise: Promise) {
        try {
            val secretKey = getOrCreateSecretKey()
            val cipher = javax.crypto.Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(javax.crypto.Cipher.ENCRYPT_MODE, secretKey)
            val iv = cipher.iv
            val encryptedBytes = cipher.doFinal(value.toByteArray(Charsets.UTF_8))
            val combined = ByteArray(iv.size + encryptedBytes.size)
            System.arraycopy(iv, 0, combined, 0, iv.size)
            System.arraycopy(encryptedBytes, 0, combined, iv.size, encryptedBytes.size)
            val base64 = android.util.Base64.encodeToString(combined, android.util.Base64.NO_WRAP)

            val prefs = reactContext.getSharedPreferences("tetherflow_secure_prefs", Context.MODE_PRIVATE)
            prefs.edit().putString(key, base64).apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SECURE_STORAGE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getSecureItem(key: String, promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences("tetherflow_secure_prefs", Context.MODE_PRIVATE)
            val base64 = prefs.getString(key, null)
            if (base64 == null) {
                promise.resolve(null)
                return
            }
            val combined = android.util.Base64.decode(base64, android.util.Base64.NO_WRAP)
            if (combined.size < 12) {
                promise.resolve(null)
                return
            }
            val iv = ByteArray(12)
            val encryptedBytes = ByteArray(combined.size - 12)
            System.arraycopy(combined, 0, iv, 0, 12)
            System.arraycopy(combined, 12, encryptedBytes, 0, encryptedBytes.size)

            val secretKey = getOrCreateSecretKey()
            val cipher = javax.crypto.Cipher.getInstance("AES/GCM/NoPadding")
            val spec = javax.crypto.spec.GCMParameterSpec(128, iv)
            cipher.init(javax.crypto.Cipher.DECRYPT_MODE, secretKey, spec)
            val decryptedBytes = cipher.doFinal(encryptedBytes)
            promise.resolve(String(decryptedBytes, Charsets.UTF_8))
        } catch (e: Exception) {
            promise.reject("SECURE_STORAGE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun removeSecureItem(key: String, promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences("tetherflow_secure_prefs", Context.MODE_PRIVATE)
            prefs.edit().remove(key).apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SECURE_STORAGE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun extractRawThumbnail(filePath: String, promise: Promise) {
        Thread {
            try {
                val cleanPath = filePath.replace("file://", "")
                val srcFile = File(cleanPath)
                if (!srcFile.exists()) {
                    promise.resolve(filePath)
                    return@Thread
                }

                val thumbsDir = File(reactContext.cacheDir, "Thumbnails")
                if (!thumbsDir.exists()) thumbsDir.mkdirs()
                val thumbFile = File(thumbsDir, "thumb_${srcFile.nameWithoutExtension}.jpg")

                if (thumbFile.exists() && thumbFile.length() > 0) {
                    promise.resolve("file://" + thumbFile.absolutePath)
                    return@Thread
                }

                val ext = srcFile.extension.uppercase()
                if (ext == "JPG" || ext == "JPEG") {
                    val opts = android.graphics.BitmapFactory.Options().apply {
                        inSampleSize = 4
                    }
                    val bmp = android.graphics.BitmapFactory.decodeFile(srcFile.absolutePath, opts)
                    if (bmp != null) {
                        val fos = FileOutputStream(thumbFile)
                        bmp.compress(android.graphics.Bitmap.CompressFormat.JPEG, 85, fos)
                        fos.flush()
                        fos.close()
                        bmp.recycle()
                        promise.resolve("file://" + thumbFile.absolutePath)
                        return@Thread
                    }
                }

                val fis = FileInputStream(srcFile)
                val bufferSize = Math.min(srcFile.length(), 4L * 1024 * 1024).toInt()
                val headerBytes = ByteArray(bufferSize)
                val read = fis.read(headerBytes)
                fis.close()

                var jpegStart = -1
                for (i in 0 until read - 3) {
                    if (headerBytes[i] == 0xFF.toByte() &&
                        headerBytes[i + 1] == 0xD8.toByte() &&
                        headerBytes[i + 2] == 0xFF.toByte()) {
                        jpegStart = i
                        break
                    }
                }

                if (jpegStart != -1) {
                    val opts = android.graphics.BitmapFactory.Options().apply {
                        inSampleSize = 2
                    }
                    val bmp = android.graphics.BitmapFactory.decodeByteArray(headerBytes, jpegStart, read - jpegStart, opts)
                    if (bmp != null) {
                        val fos = FileOutputStream(thumbFile)
                        bmp.compress(android.graphics.Bitmap.CompressFormat.JPEG, 85, fos)
                        fos.flush()
                        fos.close()
                        bmp.recycle()
                        promise.resolve("file://" + thumbFile.absolutePath)
                        return@Thread
                    }
                }

                promise.resolve(filePath)
            } catch (e: Exception) {
                promise.resolve(filePath)
            }
        }.start()
    }
}

