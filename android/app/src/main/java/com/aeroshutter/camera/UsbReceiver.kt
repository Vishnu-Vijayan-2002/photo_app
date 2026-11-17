package com.aeroshutter.camera

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbManager

class UsbReceiver(private val callback: UsbEventCallback) : BroadcastReceiver() {

    interface UsbEventCallback {
        fun onDeviceAttached(device: UsbDevice)
        fun onDeviceDetached(device: UsbDevice)
        fun onPermissionResult(device: UsbDevice, granted: Boolean)
    }

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        val device: UsbDevice? = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE)

        when (action) {
            UsbManager.ACTION_USB_DEVICE_ATTACHED -> {
                device?.let { callback.onDeviceAttached(it) }
            }
            UsbManager.ACTION_USB_DEVICE_DETACHED -> {
                device?.let { callback.onDeviceDetached(it) }
            }
            ACTION_USB_PERMISSION -> {
                val granted = intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)
                device?.let { callback.onPermissionResult(it, granted) }
            }
        }
    }

    companion object {
        const val ACTION_USB_PERMISSION = "com.aeroshutter.USB_PERMISSION"
    }
}

