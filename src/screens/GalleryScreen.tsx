/**
 * AeroShutter Photo Gallery Screen
 * Interactive gallery with RAW/JPEG filters, search, and detail inspector.
 * Implements Option 2: Manual Selection with 1-click batch upload to Google Drive.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useApp } from '../context/AppContext';
import { useSession } from '../context/SessionContext';
import { useUpload } from '../context/UploadContext';
import { Header } from '../components/common/Header';
import { Button } from '../components/common/Button';
import { PhotoGrid } from '../components/gallery/PhotoGrid';
import { PhotoDetailModal } from '../components/gallery/PhotoDetailModal';
import { UploadModeSelector } from '../components/upload/UploadModeSelector';
import { PresetConfigModal } from '../components/upload/PresetConfigModal';
import { Photo, PhotoFilter } from '../types/photo';
import { photoRepo } from '../database/photoRepository';
import { cameraManager } from '../services/camera/CameraManager';
import { PhotoEditorScreen } from './PhotoEditorScreen';

export const GalleryScreen: React.FC = () => {
  const { theme } = useApp();
  const { activeSession } = useSession();
  const { queueState, enqueueSelectedPhotos } = useUpload();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'RAW' | 'JPEG' | 'COMPLETED' | 'UPLOADING' | 'FAILED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Manual Selection state (Option 2)
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [presetModalVisible, setPresetModalVisible] = useState(false);
  const [isUploadingBatch, setIsUploadingBatch] = useState(false);

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

  const toggleSelectPhoto = (photo: Photo) => {
    const next = new Set(selectedIds);
    if (next.has(photo.id)) {
      next.delete(photo.id);
    } else {
      next.add(photo.id);
    }
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === photos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(photos.map((p) => p.id)));
    }
  };

  const handleUploadSelected = async () => {
    const photosToUpload = photos.filter((p) => selectedIds.has(p.id));
    if (photosToUpload.length === 0) return;

    setIsUploadingBatch(true);
    await enqueueSelectedPhotos(photosToUpload);
    setIsUploadingBatch(false);
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

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
        rightAction={
          photos.length > 0 ? (
            <Button
              title={isSelectionMode ? 'Cancel' : 'Select'}
              variant={isSelectionMode ? 'secondary' : 'primary'}
              size="sm"
              onPress={() => {
                setIsSelectionMode(!isSelectionMode);
                if (isSelectionMode) setSelectedIds(new Set());
              }}
            />
          ) : undefined
        }
      />

      <View style={styles.topControlContainer}>
        {/* Upload Mode Selector */}
        <UploadModeSelector onOpenPresetConfig={() => setPresetModalVisible(true)} />

        {/* Selection Toolbar when selection mode is active */}
        {isSelectionMode ? (
          <View style={[styles.selectionToolbar, { backgroundColor: theme.colors.surfaceActive }]}>
            <Text style={[styles.selectionCountText, { color: theme.colors.textPrimary }]}>
              {selectedIds.size} of {photos.length} selected
            </Text>
            <TouchableOpacity onPress={handleSelectAll} style={styles.selectAllBtn}>
              <Text style={[styles.selectAllText, { color: theme.colors.primary }]}>
                {selectedIds.size === photos.length ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Search Input */}
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

        {/* Filter Pills */}
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
                        color: isSelected ? '#FFFFFF' : theme.colors.textSecondary,
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
      </View>

      {/* Photo Grid with Multi-Selection Support */}
      <View style={styles.gridContainer}>
        <PhotoGrid
          photos={photos}
          onSelectPhoto={(photo) => setSelectedPhoto(photo)}
          isSelectable={isSelectionMode}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelectPhoto}
        />
      </View>

      {/* Floating Batch Upload Bar (Option 2: 1-Click Manual Upload) */}
      {isSelectionMode && selectedIds.size > 0 ? (
        <View style={[styles.floatingUploadBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.floatingInfo}>
            <Text style={[styles.floatingTitle, { color: theme.colors.textPrimary }]}>
              {selectedIds.size} Photo{selectedIds.size > 1 ? 's' : ''} Ready
            </Text>
            <Text style={[styles.floatingSubtitle, { color: theme.colors.textMuted }]}>
              Target: Google Drive / {activeSession?.name || 'TetherFlow'}
            </Text>
          </View>
          <Button
            title={`Upload Selected (${selectedIds.size})`}
            variant="primary"
            size="md"
            loading={isUploadingBatch}
            onPress={handleUploadSelected}
          />
        </View>
      ) : null}

      <PhotoDetailModal
        photo={selectedPhoto}
        visible={selectedPhoto !== null}
        onClose={() => setSelectedPhoto(null)}
        onOpenEditor={(p) => setEditingPhoto(p)}
      />

      <PresetConfigModal
        visible={presetModalVisible}
        onClose={() => setPresetModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topControlContainer: {
    paddingHorizontal: 16,
  },
  selectionToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 10,
  },
  selectionCountText: {
    fontSize: 13,
    fontWeight: '700',
  },
  selectAllBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  selectAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  searchContainer: {
    marginBottom: 10,
  },
  searchInput: {
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    borderWidth: 1,
  },
  filtersContainer: {
    marginBottom: 12,
  },
  filterScroll: {
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 12,
  },
  gridContainer: {
    flex: 1,
  },
  floatingUploadBar: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  floatingInfo: {
    flex: 1,
    marginRight: 12,
  },
  floatingTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  floatingSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
});
