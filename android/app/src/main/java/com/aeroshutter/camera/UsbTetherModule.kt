package com.aeroshutter.camera

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.usb.*
import android.os.Build
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlinx.coroutines.*
import java.io.File
import java.io.FileOutputStream

class UsbTetherModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), UsbReceiver.UsbEventCallback {

    private val usbManager: UsbManager =
        reactContext.getSystemService(Context.USB_SERVICE) as UsbManager

    private var activeDevice: UsbDevice? = null
    private var connection: UsbDeviceConnection? = null
    private var ptpInterface: UsbInterface? = null
    private var endpointIn: UsbEndpoint? = null
    private var endpointOut: UsbEndpoint? = null
    private var endpointInterrupt: UsbEndpoint? = null

    private var transactionId = 1
    private var isPollingEvents = false
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    private var permissionPromise: Promise? = null

    init {
        val receiver = UsbReceiver(this)
        val filter = IntentFilter().apply {
            addAction(UsbManager.ACTION_USB_DEVICE_ATTACHED)
            addAction(UsbManager.ACTION_USB_DEVICE_DETACHED)
            addAction(UsbReceiver.ACTION_USB_PERMISSION)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            reactContext.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            reactContext.registerReceiver(receiver, filter)
        }
    }

    override fun getName(): String = "UsbTetherModule"

    @ReactMethod
    fun getConnectedDevices(promise: Promise) {
        val result = Arguments.createArray()
        val deviceList = usbManager.deviceList

        for ((_, device) in deviceList) {
            val map = Arguments.createMap().apply {
                putInt("deviceId", device.deviceId)
                putInt("vendorId", device.vendorId)
                putInt("productId", device.productId)
                putString("deviceName", device.deviceName)
                putString("manufacturerName", device.manufacturerName ?: "Unknown")
                putString("productName", device.productName ?: "Camera Device")
                putString("serialNumber", device.serialNumber ?: "")
                putBoolean("hasPermission", usbManager.hasPermission(device))
            }
            result.pushMap(map)
        }
        promise.resolve(result)
    }

    @ReactMethod
    fun requestPermission(deviceId: Int, promise: Promise) {
        val device = usbManager.deviceList.values.find { it.deviceId == deviceId }
        if (device == null) {
            promise.reject("DEVICE_NOT_FOUND", "USB Device with ID $deviceId not found")
            return
        }

        if (usbManager.hasPermission(device)) {
            promise.resolve(true)
            return
        }

        this.permissionPromise = promise
        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
        val intent = PendingIntent.getBroadcast(
            reactContext,
            0,
            Intent(UsbReceiver.ACTION_USB_PERMISSION),
            flags
        )
        usbManager.requestPermission(device, intent)
    }

    @ReactMethod
    fun openSession(deviceId: Int, promise: Promise) {
        val device = usbManager.deviceList.values.find { it.deviceId == deviceId }
        if (device == null) {
            promise.reject("DEVICE_NOT_FOUND", "USB Device not found")
            return
        }

        if (!usbManager.hasPermission(device)) {
            promise.reject("PERMISSION_DENIED", "USB Permission not granted for camera")
            return
        }

        scope.launch {
            try {
                val conn = usbManager.openDevice(device) ?: throw Exception("Failed to open USB device connection")
                connection = conn
                activeDevice = device

                // Locate PTP / Still Image interface (Class 6)
                for (i in 0 until device.interfaceCount) {
                    val iface = device.getInterface(i)
                    if (iface.interfaceClass == UsbConstants.USB_CLASS_STILL_IMAGE || iface.interfaceClass == 6) {
                        ptpInterface = iface
                        break
                    }
                }

                val iface = ptpInterface ?: device.getInterface(0)
                conn.claimInterface(iface, true)

                // Locate Bulk In / Bulk Out / Interrupt Endpoints
                for (j in 0 until iface.endpointCount) {
                    val ep = iface.getEndpoint(j)
                    if (ep.type == UsbConstants.USB_ENDPOINT_XFER_BULK) {
                        if (ep.direction == UsbConstants.USB_DIR_IN) {
                            endpointIn = ep
                        } else {
                            endpointOut = ep
                        }
                    } else if (ep.type == UsbConstants.USB_ENDPOINT_XFER_INT) {
                        endpointInterrupt = ep
                    }
                }

                // Send OpenSession command
                val cmd = PtpProtocolHandler.createCommandPacket(
                    PtpProtocolHandler.PTP_OP_OPEN_SESSION,
                    transactionId++,
                    intArrayOf(1) // Session ID 1
                )
                conn.bulkTransfer(endpointOut, cmd, cmd.size, 2000)

                // Read OpenSession response
                val respBuffer = ByteArray(512)
                conn.bulkTransfer(endpointIn, respBuffer, respBuffer.size, 2000)

                // Start event polling
                startEventPolling()

                withContext(Dispatchers.Main) {
                    promise.resolve(true)
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    promise.reject("SESSION_ERROR", e.message)
                }
            }
        }
    }

    @ReactMethod
    fun captureShutter(promise: Promise) {
        scope.launch {
            try {
                val conn = connection
                val epOut = endpointOut
                if (conn == null || epOut == null) {
                    throw Exception("No active PTP camera session")
                }

                val cmd = PtpProtocolHandler.createCommandPacket(
                    PtpProtocolHandler.PTP_OP_INITIATE_CAPTURE,
                    transactionId++,
                    intArrayOf(0, 0)
                )
                conn.bulkTransfer(epOut, cmd, cmd.size, 2000)

                withContext(Dispatchers.Main) {
                    promise.resolve(true)
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    promise.reject("CAPTURE_ERROR", e.message)
                }
            }
        }
    }

    @ReactMethod
    fun closeSession(promise: Promise) {
        isPollingEvents = false
        connection?.let { conn ->
            ptpInterface?.let { conn.releaseInterface(it) }
            conn.close()
        }
        connection = null
        activeDevice = null
        promise.resolve(true)
    }

    private fun startEventPolling() {
        isPollingEvents = true
        scope.launch {
            val buffer = ByteArray(64)
            while (isPollingEvents && connection != null && endpointInterrupt != null) {
                val read = connection?.bulkTransfer(endpointInterrupt, buffer, buffer.size, 1000) ?: -1
                if (read > 0) {
                    val resp = PtpProtocolHandler.parseResponse(buffer)
                    if (resp.code == PtpProtocolHandler.PTP_EC_OBJECT_ADDED) {
                        val objectHandle = if (resp.params.isNotEmpty()) resp.params[0] else 0
                        retrievePtpObject(objectHandle)
                    }
                }
                delay(100)
            }
        }
    }

    private fun retrievePtpObject(objectHandle: Int) {
        scope.launch {
            try {
                val conn = connection ?: return@launch
                val epOut = endpointOut ?: return@launch
                val epIn = endpointIn ?: return@launch

                // GetObject PTP command
                val cmd = PtpProtocolHandler.createCommandPacket(
                    PtpProtocolHandler.PTP_OP_GET_OBJECT,
                    transactionId++,
                    intArrayOf(objectHandle)
                )
                conn.bulkTransfer(epOut, cmd, cmd.size, 2000)

                // Stream into output file
                val targetDir = File(reactContext.getExternalFilesDir(null), "Photos")
                if (!targetDir.exists()) targetDir.mkdirs()

                val fileName = "DSC_PTP_${System.currentTimeMillis()}.JPG"
                val targetFile = File(targetDir, fileName)
                val fos = FileOutputStream(targetFile)

                val readBuffer = ByteArray(16384)
                var bytesRead: Int
                while (true) {
                    bytesRead = conn.bulkTransfer(epIn, readBuffer, readBuffer.size, 2000)
                    if (bytesRead <= 0) break
                    fos.write(readBuffer, 0, bytesRead)
                }
                fos.flush()
                fos.close()

                val event = Arguments.createMap().apply {
                    putString("fileName", fileName)
                    putString("localPath", "file://" + targetFile.absolutePath)
                    putDouble("fileSize", targetFile.length().toDouble())
                }

                sendEvent("USB_PHOTO_CAPTURED", event)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    override fun onDeviceAttached(device: UsbDevice) {
        val map = Arguments.createMap().apply {
            putInt("deviceId", device.deviceId)
            putString("productName", device.productName ?: "Camera")
        }
        sendEvent("USB_DEVICE_ATTACHED", map)
    }

    override fun onDeviceDetached(device: UsbDevice) {
        if (activeDevice?.deviceId == device.deviceId) {
            isPollingEvents = false
            connection?.close()
            connection = null
            activeDevice = null
        }
        sendEvent("USB_DEVICE_DETACHED", null)
    }

    override fun onPermissionResult(device: UsbDevice, granted: Boolean) {
        permissionPromise?.resolve(granted)
        permissionPromise = null
    }
}
