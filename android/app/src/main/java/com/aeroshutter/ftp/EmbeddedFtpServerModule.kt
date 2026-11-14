package com.aeroshutter.ftp

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File

class EmbeddedFtpServerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var ftpServer: CameraFtpServer? = null

    override fun getName(): String = "EmbeddedFtpServerModule"

    @ReactMethod
    fun startServer(port: Int, promise: Promise) {
        try {
            val photosDir = File(reactContext.getExternalFilesDir(null), "Photos")
            if (!photosDir.exists()) photosDir.mkdirs()

            ftpServer?.stop()
            val server = CameraFtpServer(port, photosDir) { file ->
                val event = Arguments.createMap().apply {
                    putString("fileName", file.name)
                    putString("localPath", "file://" + file.absolutePath)
                    putDouble("fileSize", file.length().toDouble())
                }
                sendEvent("FTP_PHOTO_UPLOADED", event)
            }

            val ip = server.start()
            ftpServer = server

            val map = Arguments.createMap().apply {
                putBoolean("isRunning", true)
                putString("ipAddress", ip)
                putInt("port", port)
            }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("FTP_START_ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopServer(promise: Promise) {
        try {
            ftpServer?.stop()
            ftpServer = null
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("FTP_STOP_ERROR", e.message)
        }
    }

    @ReactMethod
    fun getStatus(promise: Promise) {
        val server = ftpServer
        val map = Arguments.createMap().apply {
            putBoolean("isRunning", server?.isServerRunning() ?: false)
            putString("ipAddress", server?.getLocalIpAddress() ?: "192.168.43.1")
        }
        promise.resolve(map)
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }
}
