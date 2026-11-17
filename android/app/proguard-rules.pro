# AeroShutter ProGuard Rules

# Keep React Native Native Modules
-keepclassmembers class * extends com.facebook.react.bridge.ReactContextBaseJavaModule {
   public <methods>;
}

-keepclassmembers class * extends com.facebook.react.bridge.JavaScriptModule {
   public <methods>;
}

# Keep Coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}

# Keep PTP / USB models
-keep class com.aeroshutter.camera.** { *; }
-keep class com.aeroshutter.ftp.** { *; }

