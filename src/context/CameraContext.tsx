/**
 * AeroShutter Camera Context
 * Supplies camera telemetry, connection controls, shutter trigger, and mode switching.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CameraInfo, ConnectionMode } from '../types/camera';
import { cameraManager } from '../services/camera/CameraManager';

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
  const autoIntervalRef = React.useRef<any>(null);

  useEffect(() => {
    const unsub = cameraManager.subscribeToStatus((info) => {
      setCameraInfo(info);
    });
    return () => {
      unsub();
      if (autoIntervalRef.current) clearInterval(autoIntervalRef.current);
    };
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
      if (autoIntervalRef.current) clearInterval(autoIntervalRef.current);
      setIsAutoCapturing(false);
    }
    await cameraManager.disconnect();
  };

  const triggerShutter = async () => {
    await cameraManager.triggerRemoteShutter();
  };

  const toggleAutoCapture = () => {
    if (isAutoCapturing) {
      if (autoIntervalRef.current) clearInterval(autoIntervalRef.current);
      setIsAutoCapturing(false);
    } else {
      setIsAutoCapturing(true);
      autoIntervalRef.current = setInterval(() => {
        triggerShutter();
      }, 4000);
    }
  };

  const setMockProfile = (_profile: 'Sony' | 'Canon' | 'Nikon') => {
    // Deprecated: Hardware auto-detects brand
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

