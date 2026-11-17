/**
 * AeroShutter Upload Context
 * Provides real-time upload queue telemetry, flexible mode switching,
 * Google Account management, and manual batch upload triggers.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UploadQueueState, UploadMode, UploadPresetConfig, UploadTask } from '../types/upload';
import { Photo } from '../types/photo';
import { GoogleDriveAccount } from '../types/googleDrive';
import { uploadQueueManager } from '../services/queue/UploadQueueManager';
import { googleAuthService } from '../services/cloud/GoogleAuthService';

interface UploadContextType {
  queueState: UploadQueueState;
  currentMode: UploadMode;
  setUploadMode: (mode: UploadMode) => void;
  presetConfig: UploadPresetConfig;
  updatePresetConfig: (config: Partial<UploadPresetConfig>) => void;
  enqueueSelectedPhotos: (photos: Photo[]) => Promise<UploadTask[]>;
  pauseUploads: () => void;
  resumeUploads: () => void;
  retryAllFailed: () => Promise<void>;
  retryTask: (taskId: string) => Promise<void>;
  account: GoogleDriveAccount | null;
  connectAccountWithToken: (token: string, refreshToken?: string) => Promise<GoogleDriveAccount>;
  signOutAccount: () => Promise<void>;
}

const initialPresetConfig: UploadPresetConfig = {
  targetFolderPattern: 'SESSION_NAME',
  transferWorkflow: 'DUAL_TRANSFER',
  selectedPresetId: 'portra-400',
  wifiOnly: false,
  maxConcurrency: 2,
  autoCreateSessionFolder: true,
  deleteLocalAfterUpload: false,
};

const initialQueueState: UploadQueueState = {
  tasks: [],
  isPaused: false,
  activeConcurrency: 0,
  maxConcurrency: 2,
  metrics: {
    currentBytesPerSecond: 0,
    averageBytesPerSecond: 0,
    activeUploadsCount: 0,
    estimatedRemainingSeconds: 0,
  },
  totalPendingCount: 0,
  totalCompletedCount: 0,
  totalFailedCount: 0,
  currentMode: 'AUTO_CONTINUOUS',
  presetConfig: initialPresetConfig,
};

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const UploadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queueState, setQueueState] = useState<UploadQueueState>(initialQueueState);
  const [account, setAccount] = useState<GoogleDriveAccount | null>(googleAuthService.getCurrentAccount());

  useEffect(() => {
    uploadQueueManager.getState().then((s) => setQueueState(s));

    const unsubQueue = uploadQueueManager.subscribe((state) => {
      setQueueState(state);
    });

    const unsubAuth = googleAuthService.subscribe((acc) => {
      setAccount(acc);
    });

    return () => {
      unsubQueue();
      unsubAuth();
    };
  }, []);

  const setUploadMode = (mode: UploadMode) => {
    uploadQueueManager.setUploadMode(mode);
  };

  const updatePresetConfig = (config: Partial<UploadPresetConfig>) => {
    uploadQueueManager.updatePresetConfig(config);
  };

  const enqueueSelectedPhotos = async (photos: Photo[]): Promise<UploadTask[]> => {
    return await uploadQueueManager.enqueueSelectedPhotos(photos);
  };

  const pauseUploads = () => {
    uploadQueueManager.pause();
  };

  const resumeUploads = () => {
    uploadQueueManager.resume();
  };

  const retryAllFailed = async () => {
    await uploadQueueManager.retryAllFailed();
  };

  const retryTask = async (taskId: string) => {
    await uploadQueueManager.retryTask(taskId);
  };

  const connectAccountWithToken = async (token: string, refreshToken?: string): Promise<GoogleDriveAccount> => {
    return await googleAuthService.connectWithToken(token, refreshToken);
  };

  const signOutAccount = async (): Promise<void> => {
    await googleAuthService.signOut();
  };

  return (
    <UploadContext.Provider
      value={{
        queueState,
        currentMode: queueState.currentMode,
        setUploadMode,
        presetConfig: queueState.presetConfig,
        updatePresetConfig,
        enqueueSelectedPhotos,
        pauseUploads,
        resumeUploads,
        retryAllFailed,
        retryTask,
        account,
        connectAccountWithToken,
        signOutAccount,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
};

export const useUpload = (): UploadContextType => {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
};
