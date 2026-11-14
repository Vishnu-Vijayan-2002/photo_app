/**
 * AeroShutter Live Shoot Screen
 * Primary tethering HUD for real-time photo streaming and cloud uploads.
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useApp } from '../context/AppContext';
import { useCamera } from '../context/CameraContext';
import { useSession } from '../context/SessionContext';
import { Header } from '../components/common/Header';
import { CameraStatusHUD } from '../components/camera/CameraStatusHUD';
import { ConnectionModeSelector } from '../components/camera/ConnectionModeSelector';
import { FtpServerConfigCard } from '../components/camera/FtpServerConfigCard';
import { UsbConnectionCard } from '../components/camera/UsbConnectionCard';
import { SessionSelector } from '../components/session/SessionSelector';
import { PhotoGrid } from '../components/gallery/PhotoGrid';
import { PhotoDetailModal } from '../components/gallery/PhotoDetailModal';
import { Button } from '../components/common/Button';
import { Photo } from '../types/photo';
import { photoRepo } from '../database/photoRepository';
import { cameraManager } from '../services/camera/CameraManager';
import { PhotoEditorScreen } from './PhotoEditorScreen';

export const LiveShootScreen: React.FC = () => {
  const { theme } = useApp();
  const { connectionMode, triggerShutter } = useCamera();
  const { activeSession } = useSession();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);

  const loadPhotos = async () => {
    if (activeSession) {
      const list = await photoRepo.getPhotos({ sessionId: activeSession.id });
      setPhotos(list);
    }
  };

  useEffect(() => {
    loadPhotos();

    const unsub = cameraManager.subscribeToPhotos(() => {
      loadPhotos();
    });

    return unsub;
  }, [activeSession?.id]);

  if (editingPhoto) {
    return (
      <PhotoEditorScreen
        photo={editingPhoto}
        onBack={() => setEditingPhoto(null)}
        onTransferComplete={() => {
          setEditingPhoto(null);
          loadPhotos();
        }}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title="AeroShutter"
        subtitle="Real-time Camera Tether & Instant Drive Sync"
        rightAction={
          <Button
            title="● Shoot"
            variant="primary"
            size="sm"
            onPress={triggerShutter}
          />
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        <SessionSelector />
        <CameraStatusHUD />

        {connectionMode === 'FTP_WIFI' ? <FtpServerConfigCard /> : null}
        {connectionMode === 'USB_OTG' ? <UsbConnectionCard /> : null}

        <ConnectionModeSelector />

        <View style={styles.galleryHeader}>
          <PhotoGrid
            photos={photos}
            onSelectPhoto={(photo) => setSelectedPhoto(photo)}
            emptyMessage="No tethered shots in this session yet."
          />
        </View>
      </ScrollView>

      <PhotoDetailModal
        photo={selectedPhoto}
        visible={selectedPhoto !== null}
        onClose={() => setSelectedPhoto(null)}
        onOpenEditor={(p) => setEditingPhoto(p)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  galleryHeader: {
    marginTop: 10,
    minHeight: 300,
  },
});
