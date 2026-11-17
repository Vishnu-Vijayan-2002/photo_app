package com.aeroshutter

import android.view.View
import com.aeroshutter.camera.UsbTetherModule
import com.aeroshutter.ftp.EmbeddedFtpServerModule
import com.aeroshutter.storage.NativeStorageModule
import com.aeroshutter.database.NativeDatabaseModule
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ReactShadowNode
import com.facebook.react.uimanager.ViewManager

class AeroShutterPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(
            UsbTetherModule(reactContext),
            EmbeddedFtpServerModule(reactContext),
            NativeStorageModule(reactContext),
            NativeDatabaseModule(reactContext)
        )
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}

