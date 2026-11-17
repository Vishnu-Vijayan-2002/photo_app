package com.aeroshutter.ftp

import java.io.*
import java.net.InetAddress
import java.net.ServerSocket
import java.net.Socket

class FtpSessionHandler(
    private val controlSocket: Socket,
    private val storageDir: File,
    private val localIp: String,
    private val onPhotoReceived: (File) -> Unit
) : Runnable {

    companion object {
        private val ALLOWED_EXTENSIONS = setOf(
            "JPG", "JPEG", "CR2", "CR3", "ARW", "NEF", "RAF", "DNG", "RW2", "TIFF", "TIF"
        )
    }

    private var passiveServerSocket: ServerSocket? = null
    private var isBinaryMode = true

    override fun run() {
        try {
            val reader = BufferedReader(InputStreamReader(controlSocket.getInputStream()))
            val writer = BufferedWriter(OutputStreamWriter(controlSocket.getOutputStream()))

            sendResponse(writer, "220 AeroShutter High-Speed Camera FTP Ready")

            var line: String?
            while (reader.readLine().also { line = it } != null) {
                val commandLine = line!!.trim()
                if (commandLine.isEmpty()) continue

                val parts = commandLine.split(" ", limit = 2)
                val cmd = parts[0].uppercase()
                val arg = if (parts.size > 1) parts[1] else ""

                when (cmd) {
                    "USER" -> sendResponse(writer, "331 User name okay, need password")
                    "PASS" -> sendResponse(writer, "230 User logged in, proceed")
                    "SYST" -> sendResponse(writer, "215 UNIX Type: L8")
                    "FEAT" -> {
                        writer.write("211-Features:\r\n")
                        writer.write(" PASV\r\n")
                        writer.write(" EPSV\r\n")
                        writer.write(" UTF8\r\n")
                        writer.write("211 End\r\n")
                        writer.flush()
                    }
                    "PWD" -> sendResponse(writer, "257 \"/\" is current directory")
                    "TYPE" -> {
                        isBinaryMode = arg.uppercase() == "I" || arg.uppercase() == "L 8"
                        sendResponse(writer, "200 Type set to " + (if (isBinaryMode) "I (Binary)" else "A (ASCII)"))
                    }
                    "PASV" -> handlePasv(writer)
                    "EPSV" -> handleEpsv(writer)
                    "CWD" -> sendResponse(writer, "250 Directory changed to /")
                    "STOR" -> handleStor(writer, arg)
                    "NOOP" -> sendResponse(writer, "200 OK")
                    "QUIT" -> {
                        sendResponse(writer, "221 Goodbye")
                        break
                    }
                    else -> sendResponse(writer, "502 Command not implemented")
                }
            }
        } catch (e: Exception) {
            // Socket closed or error
        } finally {
            closePassiveSocket()
            try { controlSocket.close() } catch (ignored: Exception) {}
        }
    }

    private fun handlePasv(writer: BufferedWriter) {
        try {
            closePassiveSocket()
            // Bind on random available port
            passiveServerSocket = ServerSocket(0)
            val port = passiveServerSocket!!.localPort

            val ipParts = localIp.split(".")
            val p1 = port / 256
            val p2 = port % 256

            val pasvResponse = "227 Entering Passive Mode (${ipParts[0]},${ipParts[1]},${ipParts[2]},${ipParts[3]},$p1,$p2)"
            sendResponse(writer, pasvResponse)
        } catch (e: Exception) {
            sendResponse(writer, "425 Can't open passive connection")
        }
    }

    private fun handleEpsv(writer: BufferedWriter) {
        try {
            closePassiveSocket()
            passiveServerSocket = ServerSocket(0)
            val port = passiveServerSocket!!.localPort
            sendResponse(writer, "229 Entering Extended Passive Mode (|||$port|)")
        } catch (e: Exception) {
            sendResponse(writer, "425 Can't open passive connection")
        }
    }

    private fun handleStor(writer: BufferedWriter, rawFileName: String) {
        val cleanFileName = File(rawFileName).name
        val ext = cleanFileName.substringAfterLast(".", "").uppercase()

        if (ext.isEmpty() || ext !in ALLOWED_EXTENSIONS) {
            sendResponse(writer, "553 File format not allowed. Only camera RAW and JPEG formats accepted.")
            return
        }

        val pasvServer = passiveServerSocket
        if (pasvServer == null) {
            sendResponse(writer, "425 Use PASV first")
            return
        }

        sendResponse(writer, "150 Opening BINARY mode data connection for $cleanFileName")

        var dataSocket: Socket? = null
        try {
            dataSocket = pasvServer.accept()
            val input = dataSocket.getInputStream()

            if (!storageDir.exists()) storageDir.mkdirs()
            var destFile = File(storageDir, cleanFileName)
            if (destFile.exists()) {
                val baseName = cleanFileName.substringBeforeLast(".")
                val fileExt = cleanFileName.substringAfterLast(".", "")
                var counter = 1
                while (destFile.exists()) {
                    destFile = File(storageDir, "${baseName}_$counter.$fileExt")
                    counter++
                }
            }

            val fos = FileOutputStream(destFile)

            val buffer = ByteArray(32768)
            var bytesRead: Int
            while (input.read(buffer).also { bytesRead = it } != -1) {
                fos.write(buffer, 0, bytesRead)
            }
            fos.flush()
            fos.close()

            sendResponse(writer, "226 Transfer complete")
            onPhotoReceived(destFile)
        } catch (e: Exception) {
            sendResponse(writer, "426 Connection closed; transfer aborted")
        } finally {
            try { dataSocket?.close() } catch (ignored: Exception) {}
            closePassiveSocket()
        }
    }

    private fun closePassiveSocket() {
        try {
            passiveServerSocket?.close()
        } catch (ignored: Exception) {}
        passiveServerSocket = null
    }

    private fun sendResponse(writer: BufferedWriter, msg: String) {
        writer.write(msg + "\r\n")
        writer.flush()
    }
}

