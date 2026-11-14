// Jest Setup configuration
/* eslint-env jest */

// Mock NativeModules
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.NativeModules.UsbTetherModule = {
    getConnectedDevices: jest.fn().mockResolvedValue([]),
    requestPermission: jest.fn().mockResolvedValue(true),
    openSession: jest.fn().mockResolvedValue(true),
    captureShutter: jest.fn().mockResolvedValue(true),
  };
  RN.NativeModules.EmbeddedFtpServerModule = {
    startServer: jest.fn().mockResolvedValue({ isRunning: true, ipAddress: '192.168.43.1', port: 2121 }),
    stopServer: jest.fn().mockResolvedValue(true),
    getStatus: jest.fn().mockResolvedValue({ isRunning: true, ipAddress: '192.168.43.1' }),
  };
  return RN;
});
