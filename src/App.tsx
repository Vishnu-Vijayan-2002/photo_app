/**
 * AeroShutter Main Application Entry
 * Real-Time Camera Tethering & Instant Cloud Synchronization
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { AppProvider, useApp } from './context/AppContext';
import { CameraProvider } from './context/CameraContext';
import { SessionProvider } from './context/SessionContext';
import { UploadProvider } from './context/UploadContext';
import { AppNavigator } from './navigation/AppNavigator';
import { dbManager } from './database/database';

const Main: React.FC = () => {
  const { isDark } = useApp();

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <AppNavigator />
    </>
  );
};

export default function App(): React.JSX.Element {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function initApp() {
      try {
        await dbManager.initialize();
      } catch (err) {
        console.error('Failed to initialize database:', err);
      } finally {
        setIsReady(true);
      }
    }
    initApp();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D1FF" />
        <Text style={styles.loadingText}>Initializing TetherFlow Engine...</Text>
      </View>
    );
  }

  return (
    <AppProvider>
      <CameraProvider>
        <SessionProvider>
          <UploadProvider>
            <Main />
          </UploadProvider>
        </SessionProvider>
      </CameraProvider>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0D0F12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9AA4B2',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 14,
  },
});

