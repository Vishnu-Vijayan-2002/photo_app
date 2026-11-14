/**
 * AeroShutter Photo Editor & Color Grading Studio
 * Lightroom-style preset application, manual color adjustments, and flexible transfer workflows.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { useApp } from '../context/AppContext';
import { Header } from '../components/common/Header';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { BeforeAfterView } from '../components/grading/BeforeAfterView';
import { PresetPicker } from '../components/grading/PresetPicker';
import { ColorGradingSliders } from '../components/grading/ColorGradingSliders';
import { PresetImportModal } from '../components/grading/PresetImportModal';
import { Photo } from '../types/photo';
import { PhotoPreset, ColorGradingAdjustments, TransferChoice } from '../types/preset';
import { presetManager, BUILT_IN_PRESETS } from '../services/preset/PresetManager';
import { DEFAULT_ADJUSTMENTS } from '../services/image/ColorGradingEngine';
import { uploadQueueManager } from '../services/queue/UploadQueueManager';

interface PhotoEditorScreenProps {
  photo?: Photo;
  onBack?: () => void;
  onTransferComplete?: (choice: TransferChoice) => void;
}

export const PhotoEditorScreen: React.FC<PhotoEditorScreenProps> = ({
  photo,
  onBack,
  onTransferComplete,
}) => {
  const { theme } = useApp();
  const [presets, setPresets] = useState<PhotoPreset[]>(presetManager.getAllPresets());
  const [selectedPreset, setSelectedPreset] = useState<PhotoPreset>(BUILT_IN_PRESETS[1]); // Default to Portra 400
  const [adjustments, setAdjustments] = useState<ColorGradingAdjustments>({
    ...BUILT_IN_PRESETS[1].adjustments,
  });
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  useEffect(() => {
    const unsub = presetManager.subscribe(() => {
      setPresets(presetManager.getAllPresets());
    });
    return unsub;
  }, []);

  const handleSelectPreset = (preset: PhotoPreset) => {
    setSelectedPreset(preset);
    setAdjustments({ ...preset.adjustments });
  };

  const handleAdjustmentChange = (key: keyof ColorGradingAdjustments, value: number) => {
    setAdjustments((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleResetAll = () => {
    setAdjustments({ ...DEFAULT_ADJUSTMENTS });
    setSelectedPreset(BUILT_IN_PRESETS[0]);
  };

  const handleTransfer = async (choice: TransferChoice) => {
    setIsTransferring(true);
    try {
      if (photo) {
        if (choice === 'RAW_ORIGINAL') {
          // Transfer original RAW directly
          await uploadQueueManager.enqueuePhoto(photo);
        } else if (choice === 'GRADED_PRESET') {
          // Transfer graded version
          const gradedPhoto: Photo = {
            ...photo,
            fileName: photo.fileName.replace(/\.[^/.]+$/, '') + `_graded_${selectedPreset.name.replace(/\s+/g, '')}.jpg`,
            mimeType: 'image/jpeg',
            isRaw: false,
            rawFormat: 'JPEG',
          };
          await uploadQueueManager.enqueuePhoto(gradedPhoto);
        } else {
          // Transfer BOTH
          await uploadQueueManager.enqueuePhoto(photo);
          const gradedPhoto: Photo = {
            ...photo,
            fileName: photo.fileName.replace(/\.[^/.]+$/, '') + `_graded.jpg`,
            mimeType: 'image/jpeg',
            isRaw: false,
            rawFormat: 'JPEG',
          };
          await uploadQueueManager.enqueuePhoto(gradedPhoto);
        }
      }

      if (onTransferComplete) {
        onTransferComplete(choice);
      }
    } finally {
      setIsTransferring(false);
    }
  };

  const activePhotoUri = photo?.thumbnailPath || photo?.localPath || 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title="Color Grade Studio"
        subtitle={photo ? `${photo.fileName} (${photo.rawFormat})` : 'Lightroom Presets & Color Grading'}
        rightAction={
          onBack ? (
            <Button title="Done" size="sm" variant="outline" onPress={onBack} />
          ) : undefined
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {/* Real-Time Before/After View */}
        <View style={styles.previewContainer}>
          <BeforeAfterView
            imageUri={activePhotoUri}
            adjustments={adjustments}
            presetName={selectedPreset.name}
          />
        </View>

        {/* Transfer Action HUD */}
        <View style={[styles.transferHud, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.transferHudHeader}>
            <Text style={[styles.hudTitle, { color: theme.colors.textPrimary }]}>TRANSFER WORKFLOW</Text>
            <Badge
              label={selectedPreset.name}
              variant={selectedPreset.id === 'preset_none' ? 'secondary' : 'primary'}
              size="sm"
            />
          </View>

          <View style={styles.transferButtonsRow}>
            <Button
              title="Transfer RAW Direct"
              size="sm"
              variant="secondary"
              loading={isTransferring}
              onPress={() => handleTransfer('RAW_ORIGINAL')}
              style={styles.transferBtn}
            />
            <Button
              title="Apply & Transfer Graded"
              size="sm"
              variant="primary"
              loading={isTransferring}
              onPress={() => handleTransfer('GRADED_PRESET')}
              style={styles.transferBtn}
            />
            <Button
              title="Dual Transfer (Both)"
              size="sm"
              variant="outline"
              loading={isTransferring}
              onPress={() => handleTransfer('BOTH_RAW_AND_GRADED')}
              style={styles.transferBtn}
            />
          </View>
        </View>

        {/* Preset Carousel */}
        <PresetPicker
          presets={presets}
          selectedPresetId={selectedPreset.id}
          onSelectPreset={handleSelectPreset}
          onOpenImportModal={() => setIsImportModalVisible(true)}
        />

        {/* Manual Precision Color Grading Sliders */}
        <View style={[styles.slidersContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <ColorGradingSliders
            adjustments={adjustments}
            onChangeAdjustment={handleAdjustmentChange}
            onResetAll={handleResetAll}
          />
        </View>
      </ScrollView>

      {/* Preset Import / Save Modal */}
      <PresetImportModal
        visible={isImportModalVisible}
        onClose={() => setIsImportModalVisible(false)}
        currentAdjustments={adjustments}
        onPresetImported={(presetId) => {
          const found = presetManager.getPresetById(presetId);
          if (found) handleSelectPreset(found);
        }}
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
  previewContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  transferHud: {
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  transferHudHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  hudTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  transferButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transferBtn: {
    flex: 1,
    marginHorizontal: 2,
    paddingHorizontal: 4,
  },
  slidersContainer: {
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    minHeight: 260,
    marginBottom: 30,
  },
});
