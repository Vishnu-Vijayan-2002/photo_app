/**
 * AeroShutter Upload Context
 * Provides real-time upload queue telemetry, pause/resume, and retry controls.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UploadQueueState, UploadTask } from '../types/upload';
import { uploadQueueManager } from '../services/queue/UploadQueueManager';

interface UploadContextType {
  queueState: UploadQueueState;
  pauseUploads: () => void;
  resumeUploads: () => void;
  retryAllFailed: () => Promise<void>;
  retryTask: (taskId: string) => Promise<void>;
}

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
};

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const UploadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queueState, setQueueState] = useState<UploadQueueState>(initialQueueState);

  useEffect(() => {
    uploadQueueManager.getState().then((s) => setQueueState(s));

    const unsub = uploadQueueManager.subscribe((state) => {
      setQueueState(state);
    });

    return unsub;
  }, []);

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

  return (
    <UploadContext.Provider
      value={{
        queueState,
        pauseUploads,
        resumeUploads,
        retryAllFailed,
        retryTask,
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
