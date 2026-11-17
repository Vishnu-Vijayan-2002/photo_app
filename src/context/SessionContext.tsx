/**
 * AeroShutter Session Context
 * Manages active shooting sessions, photo counts, and session persistence.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, CreateSessionDTO } from '../types/session';
import { sessionRepo } from '../database/sessionRepository';
import { dbManager } from '../database/database';
import { cameraManager } from '../services/camera/CameraManager';

interface SessionContextType {
  sessions: Session[];
  activeSession: Session | null;
  isLoading: boolean;
  createSession: (dto: CreateSessionDTO) => Promise<Session>;
  setActiveSession: (id: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  refreshSessions: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSessionState] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSessions = async () => {
    await dbManager.initialize();
    const list = await sessionRepo.getAllSessions();
    setSessions(list);

    let active = await sessionRepo.getActiveSession();
    if (!active && list.length === 0) {
      active = await sessionRepo.createSession({
        name: 'Studio Session #' + (list.length + 1),
        description: 'Default shooting session',
      });
      const updatedList = await sessionRepo.getAllSessions();
      setSessions(updatedList);
    }
    setActiveSessionState(active);
    setIsLoading(false);
  };

  useEffect(() => {
    refreshSessions();

    // Whenever a photo is ingested, refresh the counts
    const unsub = cameraManager.subscribeToPhotos(() => {
      refreshSessions();
    });

    return unsub;
  }, []);

  const createSession = async (dto: CreateSessionDTO): Promise<Session> => {
    const newSession = await sessionRepo.createSession(dto);
    await refreshSessions();
    return newSession;
  };

  const setActiveSession = async (id: string) => {
    await sessionRepo.setActiveSession(id);
    await refreshSessions();
  };

  const deleteSession = async (id: string) => {
    await sessionRepo.deleteSession(id);
    await refreshSessions();
  };

  return (
    <SessionContext.Provider
      value={{
        sessions,
        activeSession,
        isLoading,
        createSession,
        setActiveSession,
        deleteSession,
        refreshSessions,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

