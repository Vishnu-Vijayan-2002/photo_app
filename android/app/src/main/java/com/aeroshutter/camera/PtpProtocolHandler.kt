package com.aeroshutter.camera

import java.nio.ByteBuffer
import java.nio.ByteOrder

/**
 * PTP (Picture Transfer Protocol / ISO 15740) Protocol Specification & Packet Builder
 */
object PtpProtocolHandler {
    // Container Types
    const val PTP_CONTAINER_TYPE_UNDEFINED: Short = 0x0000
    const val PTP_CONTAINER_TYPE_COMMAND: Short = 0x0001
    const val PTP_CONTAINER_TYPE_DATA: Short = 0x0002
    const val PTP_CONTAINER_TYPE_RESPONSE: Short = 0x0003
    const val PTP_CONTAINER_TYPE_EVENT: Short = 0x0004

    // PTP Operation Codes (Standard ISO 15740)
    const val PTP_OP_GET_DEVICE_INFO: Short = 0x1001.toShort()
    const val PTP_OP_OPEN_SESSION: Short = 0x1002.toShort()
    const val PTP_OP_CLOSE_SESSION: Short = 0x1003.toShort()
    const val PTP_OP_GET_STORAGE_IDS: Short = 0x1004.toShort()
    const val PTP_OP_GET_STORAGE_INFO: Short = 0x1005.toShort()
    const val PTP_OP_GET_NUM_OBJECTS: Short = 0x1006.toShort()
    const val PTP_OP_GET_OBJECT_HANDLES: Short = 0x1007.toShort()
    const val PTP_OP_GET_OBJECT_INFO: Short = 0x1008.toShort()
    const val PTP_OP_GET_OBJECT: Short = 0x1009.toShort()
    const val PTP_OP_GET_THUMB: Short = 0x100A.toShort()
    const val PTP_OP_DELETE_OBJECT: Short = 0x100B.toShort()
    const val PTP_OP_INITIATE_CAPTURE: Short = 0x100E.toShort()
    const val PTP_OP_GET_DEVICE_PROP_DESC: Short = 0x1014.toShort()
    const val PTP_OP_GET_DEVICE_PROP_VALUE: Short = 0x1015.toShort()

    // Device Property Codes
    const val PTP_PROP_BATTERY_LEVEL: Short = 0x5001.toShort()

    // Response Codes
    const val PTP_RC_OK: Short = 0x2001.toShort()
    const val PTP_RC_GENERAL_ERROR: Short = 0x2002.toShort()
    const val PTP_RC_SESSION_NOT_OPEN: Short = 0x2003.toShort()

    // Event Codes
    const val PTP_EC_OBJECT_ADDED: Short = 0x4002.toShort()
    const val PTP_EC_DEVICE_INFO_CHANGED: Short = 0x4008.toShort()

    /**
     * Create a standard PTP Command Container packet
     */
    fun createCommandPacket(opCode: Short, transactionId: Int, params: IntArray = IntArray(0)): ByteArray {
        val length = 12 + params.size * 4
        val buffer = ByteBuffer.allocate(length).order(ByteOrder.LITTLE_ENDIAN)

        buffer.putInt(length)
        buffer.putShort(PTP_CONTAINER_TYPE_COMMAND)
        buffer.putShort(opCode)
        buffer.putInt(transactionId)

        for (param in params) {
            buffer.putInt(param)
        }

        return buffer.array()
    }

    /**
     * Parse PTP response container
     */
    fun parseResponse(data: ByteArray): PtpResponse {
        if (data.size < 12) {
            return PtpResponse(data.size, PTP_CONTAINER_TYPE_UNDEFINED, PTP_RC_GENERAL_ERROR, 0, IntArray(0))
        }

        val buffer = ByteBuffer.wrap(data).order(ByteOrder.LITTLE_ENDIAN)
        val length = buffer.int
        val type = buffer.short
        val code = buffer.short
        val transactionId = buffer.int

        val paramCount = (length - 12) / 4
        val params = IntArray(paramCount)
        for (i in 0 until paramCount) {
            if (buffer.remaining() >= 4) {
                params[i] = buffer.int
            }
        }

        return PtpResponse(length, type, code, transactionId, params)
    }

    data class PtpResponse(
        val length: Int,
        val type: Short,
        val code: Short,
        val transactionId: Int,
        val params: IntArray
    ) {
        val isSuccess: Boolean get() = code == PTP_RC_OK
    }
}

