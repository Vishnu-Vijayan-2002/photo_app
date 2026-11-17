export type ConnectionMode = 'FTP_WIFI' | 'USB_OTG' | 'HOT_FOLDER' | 'MOCK_SIMULATOR';

export type CameraBrand = 'Sony' | 'Canon' | 'Nikon' | 'Fujifilm' | 'Panasonic' | 'Generic';

export type ConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'LISTENING' | 'ERROR';

export interface ExifData {
  make?: string;
  model?: string;
  lens?: string;
  focalLength?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: number;
  exposureBias?: string;
  capturedAt?: number;
  width?: number;
  height?: number;
  orientation?: number;
}

export interface CameraInfo {
  id: string;
  name: string;
  brand: CameraBrand;
  model: string;
  mode: ConnectionMode;
  status: ConnectionStatus;
  batteryLevel?: number; // 0-100%
  ipAddress?: string;
  port?: number;
  firmwareVersion?: string;
  serialNumber?: string;
  connectedAt?: number;
}

export interface FtpServerConfig {
  port: number;
  passivePortRange: {
    min: number;
    max: number;
  };
  username: string;
  password?: string;
  anonymousAllowed: boolean;
  activeIp: string;
  isRunning: boolean;
  totalTransferredBytes: number;
  photosReceived: number;
}

export interface UsbDeviceInfo {
  deviceId: number;
  vendorId: number;
  productId: number;
  deviceName: string;
  manufacturerName?: string;
  productName?: string;
  brand?: string;
  serialNumber?: string;
  hasPermission: boolean;
}

export interface CameraEvent {
  type: 'PHOTO_RECEIVED' | 'STATUS_CHANGED' | 'ERROR' | 'DEVICE_ATTACHED' | 'DEVICE_DETACHED';
  timestamp: number;
  payload: any;
}

