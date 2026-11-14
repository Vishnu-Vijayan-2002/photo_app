/**
 * AeroShutter Photo Gallery Screen
 * Interactive gallery with RAW/JPEG filters, search, and detail inspector.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useApp } from '../context/AppContext';
import { useSession } from '../context/SessionContext';
import { Header } from '../components/common/Header';
import { PhotoGrid } from '../components/gallery/PhotoGrid';
import { PhotoDetailModal } from '../components/gallery/PhotoDetailModal';
import { Photo, PhotoFilter } from '../types/photo';
import { photoRepo } from '../database/photoRepository';
import { cameraManager } from '../services/camera/CameraManager';
import { useUpload } from '../context/UploadContext';
import { PhotoEditorScreen } from './PhotoEditorScreen';

export const GalleryScreen: React.FC = () => {
  const { theme } = useApp();
  const { activeSession } = useSession();
  const { queueState } = useUpload();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'RAW' | 'JPEG' | 'COMPLETED' | 'UPLOADING' | 'FAILED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadPhotos = async () => {
    const filter: PhotoFilter = {
      sessionId: activeSession?.id,
      isRawOnly: activeFilter === 'RAW',
      isJpegOnly: activeFilter === 'JPEG',
      uploadStatus:
        activeFilter === 'COMPLETED'
          ? 'COMPLETED'
          : activeFilter === 'UPLOADING'
          ? 'UPLOADING'
          : activeFilter === 'FAILED'
          ? 'FAILED'
          : 'ALL',
      searchQuery,
    };
    const list = await photoRepo.getPhotos(filter);
    setPhotos(list);
  };

  useEffect(() => {
    loadPhotos();

    const unsubPhotos = cameraManager.subscribeToPhotos(() => {
      loadPhotos();
    });

    return unsubPhotos;
  }, [activeSession?.id, activeFilter, searchQuery, queueState]);

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

  const filterTabs: Array<{ id: typeof activeFilter; label: string }> = [
    { id: 'ALL', label: 'All' },
    { id: 'RAW', label: 'RAW' },
    { id: 'JPEG', label: 'JPEG' },
    { id: 'COMPLETED', label: 'Synced' },
    { id: 'UPLOADING', label: 'Uploading' },
    { id: 'FAILED', label: 'Failed' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title="Gallery"
        subtitle={`${photos.length} photos in ${activeSession?.name || 'Active Session'}`}
      />

      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search by file name or camera model..."
          placeholderTextColor={theme.colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.colors.surfaceActive,
              color: theme.colors.textPrimary,
              borderColor: theme.colors.border,
            },
          ]}
        />
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filterTabs.map((tab) => {
            const isSelected = activeFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveFilter(tab.id)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? theme.colors.primary : theme.colors.surfaceActive,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    {
                      color: isSelected ? theme.colors.textInverse : theme.colors.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.gridContainer}>
        <PhotoGrid
          photos={photos}
          onSelectPhoto={(photo) => setSelectedPhoto(photo)}
          emptyMessage="No photos match the selected filter."
        />
      </View>

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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  filtersContainer: {
    marginVertical: 4,
  },
  filterScroll: {
    paddingHorizontal: 16,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterText: {
    fontSize: 12,
  },
  gridContainer: {
    flex: 1,
    marginTop: 6,
  },
});
