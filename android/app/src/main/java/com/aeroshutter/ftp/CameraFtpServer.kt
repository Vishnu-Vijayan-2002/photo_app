package com.aeroshutter.ftp

import kotlinx.coroutines.*
import java.io.File
import java.net.InetAddress
import java.net.NetworkInterface
import java.net.ServerSocket
import java.util.concurrent.Executors

class CameraFtpServer(
    private val port: Int = 2121,
    private val storageDir: File,
    private val onPhotoReceived: (File) -> Unit
) {
    private var serverSocket: ServerSocket? = null
    private var isRunning = false
    private val executor = Executors.newCachedThreadPool()
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    fun start(): String {
        if (isRunning) return getLocalIpAddress()

        isRunning = true
        serverSocket = ServerSocket(port)
        val ip = getLocalIpAddress()

        scope.launch {
            while (isRunning && serverSocket != null) {
                try {
                    val clientSocket = serverSocket?.accept() ?: break
                    executor.submit(FtpSessionHandler(clientSocket, storageDir, ip, onPhotoReceived))
                } catch (e: Exception) {
                    break
                }
            }
        }

        return ip
    }

    fun stop() {
        isRunning = false
        try {
            serverSocket?.close()
        } catch (ignored: Exception) {}
        serverSocket = null
        executor.shutdownNow()
    }

    fun getLocalIpAddress(): String {
        try {
            val interfaces = NetworkInterface.getNetworkInterfaces()
            while (interfaces.hasMoreElements()) {
                val iface = interfaces.nextElement()
                if (iface.isLoopback || !iface.isUp) continue

                val addresses = iface.inetAddresses
                while (addresses.hasMoreElements()) {
                    val addr = addresses.nextElement()
                    if (!addr.isLoopbackAddress && addr is java.net.Inet4Address) {
                        return addr.hostAddress ?: "127.0.0.1"
                    }
                }
            }
        } catch (ignored: Exception) {}
        return "192.168.43.1" // Default mobile hotspot gateway
    }

    fun isServerRunning(): Boolean = isRunning
}
