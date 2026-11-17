/**
 * AeroShutter USB Tether Service
 * Bridges to native Android USB Host API / PTP subsystem for direct cable tethering.
 */

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { UsbDeviceInfo } from '../../types/camera';

const { UsbTetherModule } = NativeModules;

export class UsbTetherService {
  private static instance: UsbTetherService;
  private connectedDevice: UsbDeviceInfo | null = null;
  private eventEmitter?: NativeEventEmitter;
  private onPhotoCallback?: (photoMeta: { fileName: string; localPath: string; fileSize: number }) => void;

  public static getInstance(): UsbTetherService {
    if (!UsbTetherService.instance) {
      UsbTetherService.instance = new UsbTetherService();
    }
    return UsbTetherService.instance;
  }

  constructor() {
    try {
      if (UsbTetherModule) {
        this.eventEmitter = new NativeEventEmitter(UsbTetherModule);
        this.eventEmitter.addListener('USB_PHOTO_CAPTURED', (event) => {
          if (this.onPhotoCallback) {
            this.onPhotoCallback(event);
          }
        });

        this.eventEmitter.addListener('USB_DEVICE_ATTACHED', (device) => {
          this.connectedDevice = device;
        });

        this.eventEmitter.addListener('USB_DEVICE_DETACHED', () => {
          this.connectedDevice = null;
        });
      }
    } catch (e) {
      console.warn('Could not initialize native USB event emitter:', e);
    }
  }

  public setOnPhotoReceived(cb: (photoMeta: { fileName: string; localPath: string; fileSize: number }) => void) {
    this.onPhotoCallback = cb;
  }

  public async scanForCameras(): Promise<UsbDeviceInfo[]> {
    if (Platform.OS === 'android' && UsbTetherModule) {
      try {
        return await UsbTetherModule.getConnectedDevices();
      } catch (err) {
        console.warn('Error querying USB devices:', err);
      }
    }

    return [];
  }

  public async requestUsbPermission(deviceId: number): Promise<boolean> {
    if (Platform.OS === 'android' && UsbTetherModule) {
      try {
        return await UsbTetherModule.requestPermission(deviceId);
      } catch (err) {
        console.warn('USB permission request error:', err);
      }
    }
    return false;
  }

  public async startPtpSession(deviceId: number): Promise<boolean> {
    if (Platform.OS === 'android' && UsbTetherModule) {
      try {
        return await UsbTetherModule.openSession(deviceId);
      } catch (err) {
        console.warn('PTP session open error:', err);
      }
    }
    return false;
  }

  public async getBatteryLevel(): Promise<number | null> {
    if (Platform.OS === 'android' && UsbTetherModule && UsbTetherModule.getBatteryLevel) {
      try {
        return await UsbTetherModule.getBatteryLevel();
      } catch (err) {
        console.warn('Battery reading error:', err);
      }
    }
    return null;
  }

  public async triggerShutter(): Promise<boolean> {
    if (Platform.OS === 'android' && UsbTetherModule) {
      try {
        return await UsbTetherModule.captureShutter();
      } catch (err) {
        console.warn('Remote shutter release error:', err);
      }
    }
    return false;
  }

  public getConnectedDevice(): UsbDeviceInfo | null {
    return this.connectedDevice;
  }

  public async disconnect(): Promise<void> {
    if (Platform.OS === 'android' && UsbTetherModule && UsbTetherModule.closeSession) {
      try {
        await UsbTetherModule.closeSession();
      } catch (err) {
        console.warn('Error closing USB PTP session:', err);
      }
    }
    this.connectedDevice = null;
  }
}

export const usbTetherService = UsbTetherService.getInstance();

