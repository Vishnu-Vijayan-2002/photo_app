package com.aeroshutter.ftp

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.aeroshutter.R

class FtpForegroundService : Service() {

    companion object {
        const val CHANNEL_ID = "tetherflow_ftp_channel"
        const val NOTIFICATION_ID = 2121

        fun start(context: Context, port: Int, ip: String) {
            val intent = Intent(context, FtpForegroundService::class.java).apply {
                putExtra("port", port)
                putExtra("ip", ip)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            val intent = Intent(context, FtpForegroundService::class.java)
            context.stopService(intent)
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val port = intent?.getIntExtra("port", 2121) ?: 2121
        val ip = intent?.getStringExtra("ip") ?: "Wi-Fi"

        val notification = buildNotification(port, ip)
        startForeground(NOTIFICATION_ID, notification)

        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "TetherFlow Camera Transfer Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps wireless camera FTP server active in background"
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(port: Int, ip: String): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("TetherFlow FTP Active")
            .setContentText("Listening on $ip:$port for camera auto-transfers")
            .setSmallIcon(android.R.drawable.ic_menu_camera)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }
}

