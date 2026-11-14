/**
 * AeroShutter Camera Context
 * Supplies camera telemetry, connection controls, shutter trigger, and mode switching.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CameraInfo, ConnectionMode } from '../types/camera';
import { cameraManager } from '../services/camera/CameraManager';
import { mockCameraService } from '../services/camera/MockCameraService';

interface CameraContextType {
  cameraInfo: CameraInfo;
  connectionMode: ConnectionMode;
  setConnectionMode: (mode: ConnectionMode) => Promise<void>;
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  triggerShutter: () => Promise<void>;
  isAutoCapturing: boolean;
  toggleAutoCapture: () => void;
  setMockProfile: (profile: 'Sony' | 'Canon' | 'Nikon') => void;
}

const CameraContext = createContext<CameraContextType | undefined>(undefined);

export const CameraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cameraInfo, setCameraInfo] = useState<CameraInfo>(cameraManager.getCameraInfo());
  const [connectionMode, setMode] = useState<ConnectionMode>(cameraManager.getConnectionMode());
  const [isAutoCapturing, setIsAutoCapturing] = useState(false);

  useEffect(() => {
    const unsub = cameraManager.subscribeToStatus((info) => {
      setCameraInfo(info);
    });
    return unsub;
  }, []);

  const setConnectionMode = async (mode: ConnectionMode) => {
    setMode(mode);
    await cameraManager.setConnectionMode(mode);
  };

  const connect = async () => {
    return await cameraManager.connect();
  };

  const disconnect = async () => {
    if (isAutoCapturing) {
      mockCameraService.stopAutoCapture();
      setIsAutoCapturing(false);
    }
    await cameraManager.disconnect();
  };

  const triggerShutter = async () => {
    await cameraManager.triggerRemoteShutter();
  };

  const toggleAutoCapture = () => {
    if (mockCameraService.isAutoCapturing()) {
      mockCameraService.stopAutoCapture();
      setIsAutoCapturing(false);
    } else {
      mockCameraService.startAutoCapture(3500);
      setIsAutoCapturing(true);
    }
  };

  const setMockProfile = (profile: 'Sony' | 'Canon' | 'Nikon') => {
    mockCameraService.setProfile(profile);
    setCameraInfo(mockCameraService.getCameraInfo());
  };

  return (
    <CameraContext.Provider
      value={{
        cameraInfo,
        connectionMode,
        setConnectionMode,
        connect,
        disconnect,
        triggerShutter,
        isAutoCapturing,
        toggleAutoCapture,
        setMockProfile,
      }}
    >
      {children}
    </CameraContext.Provider>
  );
};

export const useCamera = (): CameraContextType => {
  const context = useContext(CameraContext);
  if (!context) {
    throw new Error('useCamera must be used within a CameraProvider');
  }
  return context;
};
