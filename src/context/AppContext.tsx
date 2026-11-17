/**
 * AeroShutter App Context
 * Manages global application settings, theme, and persistent preferences.
 */

import React, { createContext, useContext, useState } from 'react';
import { getTheme, AppTheme } from '../theme';

interface AppSettings {
  uploadOnlyOnWifi: boolean;
  uploadRawFiles: boolean;
  autoStartFtpServer: boolean;
  ftpServerPort: number;
  googleDriveRootFolder: string;
}

interface AppContextType {
  theme: AppTheme;
  isDark: boolean;
  toggleTheme: () => void;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const defaultSettings: AppSettings = {
  uploadOnlyOnWifi: false,
  uploadRawFiles: true,
  autoStartFtpServer: true,
  ftpServerPort: 2121,
  googleDriveRootFolder: 'AeroShutter',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(true);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const theme = getTheme(isDark);

  return (
    <AppContext.Provider
      value={{
        theme,
        isDark,
        toggleTheme,
        settings,
        updateSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

