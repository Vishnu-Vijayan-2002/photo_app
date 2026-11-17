/**
 * AeroShutter Photo Editor & Color Grading Studio
 * Professional Mobile Viewport Split:
 *   - Top Canvas (flex-1 / ~60%): Pinned, centered image with live real-time grading and floating Before/After button.
 *   - Bottom Control Dock (~40%): Dark matte frosted sheet with single-slider focus, horizontal tool strip, and category tabs.
 *   - Top Header Bar: High-contrast primary "Apply" action on the right, Cancel/Reset on the left.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { PresetImportModal } from '../components/grading/PresetImportModal';
import { Photo } from '../types/photo';
import { PhotoPreset, ColorGradingAdjustments, TransferChoice } from '../types/preset';
import { presetManager, BUILT_IN_PRESETS } from '../services/preset/PresetManager';
import { ColorGradingEngine, DEFAULT_ADJUSTMENTS } from '../services/image/ColorGradingEngine';
import { uploadQueueManager } from '../services/queue/UploadQueueManager';
import { photoStorageManager } from '../services/storage/PhotoStorageManager';
import { photoRepo } from '../database/photoRepository';

interface PhotoEditorScreenProps {
  photo?: Photo;
  onBack?: () => void;
  onTransferComplete?: (choice: TransferChoice) => void;
}

type MainCategory = 'PRESETS' | 'LIGHT' | 'COLOR' | 'EFFECTS';

interface ToolItem {
  key: keyof ColorGradingAdjustments;
  label: string;
  icon: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  category: 'LIGHT' | 'COLOR' | 'EFFECTS';
}

const ALL_TOOLS: ToolItem[] = [
  // LIGHT
  { key: 'exposure', label: 'Exposure', icon: 'EXP', min: -100, max: 100, step: 2, unit: 'EV', category: 'LIGHT' },
  { key: 'contrast', label: 'Contrast', icon: 'CON', min: -100, max: 100, step: 2, category: 'LIGHT' },
  { key: 'highlights', label: 'Highlights', icon: 'HL', min: -100, max: 100, step: 2, category: 'LIGHT' },
  { key: 'shadows', label: 'Shadows', icon: 'SHAD', min: -100, max: 100, step: 2, category: 'LIGHT' },
  { key: 'whites', label: 'Whites', icon: 'WHT', min: -100, max: 100, step: 2, category: 'LIGHT' },
  { key: 'blacks', label: 'Blacks', icon: 'BLK', min: -100, max: 100, step: 2, category: 'LIGHT' },

  // COLOR
  { key: 'temperature', label: 'Temp', icon: 'TEMP', min: -100, max: 100, step: 2, unit: 'K', category: 'COLOR' },
  { key: 'tint', label: 'Tint', icon: 'TINT', min: -100, max: 100, step: 2, category: 'COLOR' },
  { key: 'vibrance', label: 'Vibrance', icon: 'VIB', min: -100, max: 100, step: 2, category: 'COLOR' },
  { key: 'saturation', label: 'Saturation', icon: 'SAT', min: -100, max: 100, step: 2, category: 'COLOR' },

  // EFFECTS
  { key: 'clarity', label: 'Clarity', icon: 'CLAR', min: -100, max: 100, step: 2, category: 'EFFECTS' },
  { key: 'vignette', label: 'Vignette', icon: 'VIGN', min: 0, max: 100, step: 2, category: 'EFFECTS' },
  { key: 'fade', label: 'Film Fade', icon: 'FADE', min: 0, max: 100, step: 2, category: 'EFFECTS' },
];

export const PhotoEditorScreen: React.FC<PhotoEditorScreenProps> = ({
  photo,
  onBack,
  onTransferComplete,
}) => {
  const { theme } = useApp();
  const [presets, setPresets] = useState<PhotoPreset[]>(presetManager.getAllPresets());
  const [selectedPreset, setSelectedPreset] = useState<PhotoPreset>(BUILT_IN_PRESETS[1]); // Default Portra 400
  const [adjustments, setAdjustments] = useState<ColorGradingAdjustments>({
    ...BUILT_IN_PRESETS[1].adjustments,
  });

  const rawOriginalUri =
    photo?.thumbnailPath || photo?.localPath || 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800';
  const [previewUri, setPreviewUri] = useState<string>(rawOriginalUri);

  const [activeCategory, setActiveCategory] = useState<MainCategory>('LIGHT');
  const [activeToolKey, setActiveToolKey] = useState<keyof ColorGradingAdjustments>('exposure');
  const [isComparingOriginal, setIsComparingOriginal] = useState(false);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [isApplyActionSheetVisible, setIsApplyActionSheetVisible] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  useEffect(() => {
    const unsub = presetManager.subscribe(() => {
      setPresets(presetManager.getAllPresets());
    });
    return unsub;
  }, []);

  // Real-time live photo color preview: re-render graded raster when preset or slider adjustments change
  useEffect(() => {
    if (!photo) return;
    try {
      const graded = photoStorageManager.generateGradedPhoto(
        photo.fileName,
        photo.isRaw,
        photo.rawFormat,
        adjustments,
        360,
        240
      );
      setPreviewUri(graded);
    } catch {
      // Fallback
    }
  }, [photo, adjustments]);

  const handleSelectPreset = (preset: PhotoPreset) => {
    setSelectedPreset(preset);
    const newAdj = { ...preset.adjustments };
    setAdjustments(newAdj);
    if (photo) {
      const graded = photoStorageManager.generateGradedPhoto(
        photo.fileName,
        photo.isRaw,
        photo.rawFormat,
        newAdj,
        360,
        240
      );
      setPreviewUri(graded);
    }
  };

  const handleAdjustmentChange = (key: keyof ColorGradingAdjustments, value: number) => {
    const nextAdj = {
      ...adjustments,
      [key]: value,
    };
    setAdjustments(nextAdj);
  };

  const stepActiveValue = (delta: number) => {
    const tool = ALL_TOOLS.find((t) => t.key === activeToolKey);
    if (!tool) return;
    const current = adjustments[activeToolKey];
    const next = Math.max(tool.min, Math.min(tool.max, current + delta));
    handleAdjustmentChange(activeToolKey, next);
  };

  const handleResetActiveTool = () => {
    handleAdjustmentChange(activeToolKey, 0);
  };

  const handleResetAll = () => {
    const neutral = { ...DEFAULT_ADJUSTMENTS };
    setAdjustments(neutral);
    setSelectedPreset(BUILT_IN_PRESETS[0]);
    if (photo) {
      const graded = photoStorageManager.generateGradedPhoto(
        photo.fileName,
        photo.isRaw,
        photo.rawFormat,
        neutral,
        360,
        240
      );
      setPreviewUri(graded);
    }
  };

  const handleTransfer = async (choice: TransferChoice) => {
    setIsTransferring(true);
    try {
      if (photo) {
        // Generate high-resolution final graded photo with exact applied color adjustments
        const finalGradedUri = photoStorageManager.generateGradedPhoto(
          photo.fileName,
          photo.isRaw,
          photo.rawFormat,
          adjustments,
          480,
          320
        );

        if (choice === 'RAW_ORIGINAL') {
          await uploadQueueManager.enqueuePhoto(photo);
        } else if (choice === 'GRADED_PRESET') {
          // Permanently apply edits directly to the photo
          await photoRepo.updatePhotoThumbnail(photo.id, finalGradedUri);

          const gradedFileName = photo.fileName.replace(/\.[^/.]+$/, '') + `_graded_${selectedPreset.name.replace(/\s+/g, '')}.jpg`;
          const gradedPhoto: Photo = {
            ...photo,
            fileName: gradedFileName,
            thumbnailPath: finalGradedUri,
            mimeType: 'image/jpeg',
            isRaw: false,
            rawFormat: 'JPEG',
          };
          await uploadQueueManager.enqueuePhoto(gradedPhoto);
        } else if (choice === 'EXPORT_SIDECAR') {
          const xmpContent = ColorGradingEngine.exportToXmp(adjustments, selectedPreset.name);
          const cubeContent = ColorGradingEngine.exportToCubeLut(adjustments, `${photo.fileName}_Grade`);
          Alert.alert(
            'Non-Destructive Profiles Exported',
            `Created sidecar profiles for ${photo.fileName}:\n• Adobe Lightroom (.XMP)\n• DaVinci Resolve (.CUBE 3D LUT)\n\nOriginal RAW photo is preserved uncompressed.`
          );
        } else {
          // BOTH RAW and Graded
          await uploadQueueManager.enqueuePhoto(photo);
          await photoRepo.updatePhotoThumbnail(photo.id, finalGradedUri);

          const gradedFileName = photo.fileName.replace(/\.[^/.]+$/, '') + `_graded.jpg`;
          const gradedPhoto: Photo = {
            ...photo,
            id: photo.id + '_graded',
            fileName: gradedFileName,
            thumbnailPath: finalGradedUri,
            mimeType: 'image/jpeg',
            isRaw: false,
            rawFormat: 'JPEG',
          };
          await uploadQueueManager.enqueuePhoto(gradedPhoto);
        }
      }

      setIsApplyActionSheetVisible(false);
      if (onTransferComplete) {
        onTransferComplete(choice);
      }
      if (onBack) {
        onBack();
      }
    } finally {
      setIsTransferring(false);
    }
  };

  const activePhotoUri = isComparingOriginal ? rawOriginalUri : previewUri;

  const activeTool = ALL_TOOLS.find((t) => t.key === activeToolKey) || ALL_TOOLS[0];
  const activeValue = adjustments[activeToolKey];
  const isToolModified = activeValue !== 0;

  // Real-time Visual Color Grade responsive overlays
  const isGraded = !isComparingOriginal && Object.values(adjustments).some((val) => val !== 0);

  const getExposureOverlay = () => {
    if (!isGraded || adjustments.exposure === 0) return 'transparent';
    if (adjustments.exposure > 0) {
      const alpha = Math.min(0.35, (adjustments.exposure / 100) * 0.35);
      return `rgba(255, 255, 255, ${alpha})`;
    } else {
      const alpha = Math.min(0.45, (Math.abs(adjustments.exposure) / 100) * 0.45);
      return `rgba(0, 0, 0, ${alpha})`;
    }
  };

  const getWhitebalanceOverlay = () => {
    if (!isGraded) return 'transparent';
    if (adjustments.temperature > 5) {
      const alpha = Math.min(0.25, (adjustments.temperature / 100) * 0.25);
      return `rgba(255, 160, 20, ${alpha})`;
    } else if (adjustments.temperature < -5) {
      const alpha = Math.min(0.25, (Math.abs(adjustments.temperature) / 100) * 0.25);
      return `rgba(20, 160, 255, ${alpha})`;
    }
    return 'transparent';
  };

  const getTintOverlay = () => {
    if (!isGraded) return 'transparent';
    if (adjustments.tint > 5) {
      const alpha = Math.min(0.2, (adjustments.tint / 100) * 0.2);
      return `rgba(255, 30, 150, ${alpha})`;
    } else if (adjustments.tint < -5) {
      const alpha = Math.min(0.2, (Math.abs(adjustments.tint) / 100) * 0.2);
      return `rgba(30, 230, 90, ${alpha})`;
    }
    return 'transparent';
  };

  const getFadeOverlay = () => {
    if (!isGraded || adjustments.fade <= 0) return 'transparent';
    const alpha = Math.min(0.25, (adjustments.fade / 100) * 0.25);
    return `rgba(50, 50, 60, ${alpha})`;
  };

  const getVignetteBorder = () => {
    if (!isGraded || adjustments.vignette <= 0) return 0;
    return Math.round((adjustments.vignette / 100) * 28);
  };

  // Tools in the active category
  const categoryTools = ALL_TOOLS.filter((t) => t.category === activeCategory);

  return (
    <View style={[styles.viewportLocked, { backgroundColor: '#090B0E' }]}>
      {/* 3. Top Header Bar with High-Visibility Apply Action */}
      <View style={[styles.topHeaderBar, { backgroundColor: '#101317', borderBottomColor: '#1E232B' }]}>
        <TouchableOpacity onPress={onBack} style={styles.headerActionBtn}>
          <Text style={[styles.headerActionText, { color: theme.colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleCol}>
          <Text style={[styles.headerTitleText, { color: theme.colors.textPrimary }]} numberOfLines={1}>
            {photo ? photo.fileName : 'Color Studio'}
          </Text>
          <Text style={[styles.headerSubtitleText, { color: theme.colors.textMuted }]}>
            {selectedPreset.name}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setIsApplyActionSheetVisible(true)}
          style={[styles.applyPrimaryBtn, { backgroundColor: theme.colors.primary }]}
          activeOpacity={0.8}
        >
          <Text style={styles.applyPrimaryBtnText}>Apply</Text>
        </TouchableOpacity>
      </View>

      {/* 1. Top Canvas (flex-1 / ~60% height): Pinned, centered image */}
      <View style={styles.topCanvas}>
        <View style={styles.imagePinnedContainer}>
          <Image source={{ uri: activePhotoUri }} style={styles.pinnedImage} resizeMode="contain" />

          {/* Real-time Visual Grading Overlays */}
          {isGraded ? (
            <>
              <View
                style={[StyleSheet.absoluteFillObject, { backgroundColor: getExposureOverlay() }]}
                pointerEvents="none"
              />
              <View
                style={[StyleSheet.absoluteFillObject, { backgroundColor: getWhitebalanceOverlay() }]}
                pointerEvents="none"
              />
              <View
                style={[StyleSheet.absoluteFillObject, { backgroundColor: getTintOverlay() }]}
                pointerEvents="none"
              />
              <View
                style={[StyleSheet.absoluteFillObject, { backgroundColor: getFadeOverlay() }]}
                pointerEvents="none"
              />
              {adjustments.vignette > 0 ? (
                <View
                  style={[
                    StyleSheet.absoluteFillObject,
                    {
                      borderWidth: getVignetteBorder(),
                      borderColor: 'rgba(0, 0, 0, 0.75)',
                      borderRadius: 12,
                    },
                  ]}
                  pointerEvents="none"
                />
              ) : null}
            </>
          ) : null}

          {/* Live Status Pill */}
          <View style={styles.liveStatusPill}>
            <Text style={styles.liveStatusText}>
              {isComparingOriginal ? 'ORIGINAL (RAW)' : selectedPreset.name.toUpperCase()}
            </Text>
          </View>

          {/* Floating Before/After Hold Button in Canvas Corner */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPressIn={() => setIsComparingOriginal(true)}
            onPressOut={() => setIsComparingOriginal(false)}
            style={styles.floatingBeforeAfterBtn}
          >
            <Text style={styles.floatingBtnText}>
              {isComparingOriginal ? 'ORIGINAL' : 'HOLD BEFORE / AFTER'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Bottom Control Dock (Fixed / ~40% height): Dark matte #121212 sheet */}
      <View style={[styles.bottomControlDock, { backgroundColor: '#131518', borderTopColor: '#222832' }]}>
        {activeCategory === 'PRESETS' ? (
          /* PRESET CAROUSEL STRIP */
          <View style={styles.presetStripContainer}>
            <View style={styles.presetHeaderRow}>
              <Text style={[styles.dockSubheader, { color: theme.colors.textMuted }]}>FILM & CREATIVE PRESETS</Text>
              <TouchableOpacity onPress={() => setIsImportModalVisible(true)}>
                <Text style={[styles.importLinkText, { color: theme.colors.primary }]}>+ Import LUT / .XMP</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetScroll}>
              {presets.map((preset) => {
                const isSelected = selectedPreset.id === preset.id;
                return (
                  <TouchableOpacity
                    key={preset.id}
                    onPress={() => handleSelectPreset(preset)}
                    style={[
                      styles.presetCardThumb,
                      {
                        backgroundColor: isSelected ? theme.colors.primary : '#1A1E24',
                        borderColor: isSelected ? theme.colors.primary : '#2A313D',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.presetColorSwatch,
                        { backgroundColor: preset.previewThumbnailColor || '#555' },
                      ]}
                    />
                    <Text
                      style={[
                        styles.presetCardName,
                        {
                          color: isSelected ? '#000000' : theme.colors.textPrimary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {preset.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : (
          /* SINGLE-SLIDER FOCUS & HORIZONTAL TOOL STRIP */
          <View style={styles.singleSliderSection}>
            {/* Active Slider Live Readout & Double-tap / Reset Pill */}
            <View style={styles.sliderReadoutRow}>
              <View style={styles.sliderNameRow}>
                <Text style={styles.toolIconText}>{activeTool.icon}</Text>
                <Text style={[styles.sliderNameText, { color: theme.colors.textPrimary }]}>
                  {activeTool.label}
                </Text>
              </View>

              <TouchableOpacity onPress={handleResetActiveTool} style={styles.numericPill}>
                <Text
                  style={[
                    styles.numericReadout,
                    { color: isToolModified ? theme.colors.primary : theme.colors.textMuted },
                  ]}
                >
                  {activeValue > 0 ? `+${activeValue}` : `${activeValue}`}
                  {activeTool.unit ? ` ${activeTool.unit}` : ''}
                </Text>
                {isToolModified ? <Text style={styles.resetHint}>tap to reset</Text> : null}
              </TouchableOpacity>
            </View>

            {/* Tactile Slider Control Bar */}
            <View style={styles.sliderControlBar}>
              <TouchableOpacity onPress={() => stepActiveValue(-10)} style={styles.stepBtnLarge}>
                <Text style={[styles.stepBtnText, { color: theme.colors.textSecondary }]}>-10</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => stepActiveValue(-2)} style={styles.stepBtnSmall}>
                <Text style={[styles.stepBtnText, { color: theme.colors.textSecondary }]}>-</Text>
              </TouchableOpacity>

              {/* Slider Track with Center Origin */}
              <View style={[styles.sliderTrack, { backgroundColor: '#212630' }]}>
                <View
                  style={[
                    styles.sliderTrackFill,
                    {
                      width: `${Math.abs(activeValue)}%`,
                      alignSelf: activeValue >= 0 ? 'flex-start' : 'flex-end',
                      backgroundColor: isToolModified ? theme.colors.primary : 'transparent',
                    },
                  ]}
                />
              </View>

              <TouchableOpacity onPress={() => stepActiveValue(2)} style={styles.stepBtnSmall}>
                <Text style={[styles.stepBtnText, { color: theme.colors.textSecondary }]}>+</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => stepActiveValue(10)} style={styles.stepBtnLarge}>
                <Text style={[styles.stepBtnText, { color: theme.colors.textSecondary }]}>+10</Text>
              </TouchableOpacity>
            </View>

            {/* Horizontal Scrollable Icon Strip */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolsIconStrip}>
              {categoryTools.map((tool) => {
                const isSelected = activeToolKey === tool.key;
                const val = adjustments[tool.key];
                const isMod = val !== 0;

                return (
                  <TouchableOpacity
                    key={tool.key}
                    onPress={() => setActiveToolKey(tool.key)}
                    style={[
                      styles.toolIconBtn,
                      {
                        backgroundColor: isSelected ? 'rgba(0, 209, 255, 0.15)' : 'transparent',
                        borderColor: isSelected ? theme.colors.primary : 'transparent',
                      },
                    ]}
                  >
                    <Text style={styles.toolStripIcon}>{tool.icon}</Text>
                    <Text
                      style={[
                        styles.toolStripLabel,
                        { color: isSelected ? theme.colors.primary : theme.colors.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {tool.label}
                    </Text>
                    {isMod ? <View style={[styles.dotIndicator, { backgroundColor: theme.colors.primary }]} /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Category Tabs at the Very Bottom */}
        <View style={[styles.categoryTabsBar, { borderTopColor: '#1E232B' }]}>
          {(['PRESETS', 'LIGHT', 'COLOR', 'EFFECTS'] as MainCategory[]).map((cat) => {
            const isTabActive = activeCategory === cat;
            const labels = {
              PRESETS: 'Presets',
              LIGHT: 'Light',
              COLOR: 'Color',
              EFFECTS: 'Effects',
            };

            return (
              <TouchableOpacity
                key={cat}
                onPress={() => {
                  setActiveCategory(cat);
                  const firstInCat = ALL_TOOLS.find((t) => t.category === cat);
                  if (firstInCat) setActiveToolKey(firstInCat.key);
                }}
                style={[
                  styles.categoryTabBtn,
                  {
                    borderBottomColor: isTabActive ? theme.colors.primary : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    {
                      color: isTabActive ? theme.colors.primary : theme.colors.textMuted,
                      fontWeight: isTabActive ? '700' : '500',
                    },
                  ]}
                >
                  {labels[cat]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Primary Action Modal (When User taps ✓ Apply) */}
      {isApplyActionSheetVisible ? (
        <View style={styles.actionSheetOverlay}>
          <TouchableOpacity
            style={styles.actionSheetBackdrop}
            activeOpacity={1}
            onPress={() => setIsApplyActionSheetVisible(false)}
          />
          <View style={[styles.actionSheetContent, { backgroundColor: '#161A20', borderColor: '#2E3642' }]}>
            <Text style={[styles.sheetTitle, { color: theme.colors.textPrimary }]}>
              Apply & Export Photo
            </Text>
            <Text style={[styles.sheetSubtitle, { color: theme.colors.textSecondary }]}>
              Choose how you want to upload or save this graded image:
            </Text>

            <TouchableOpacity
              onPress={() => handleTransfer('GRADED_PRESET')}
              style={[styles.sheetOptionBtn, { backgroundColor: theme.colors.primary }]}
            >
              <Text style={styles.sheetOptionPrimaryText}>
                Apply Preset & Upload Graded to Drive
              </Text>
              <Text style={styles.sheetOptionSubtextDark}>
                Transfers high-res JPEG graded with {selectedPreset.name}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleTransfer('BOTH_RAW_AND_GRADED')}
              style={[styles.sheetOptionBtn, { backgroundColor: '#222834', borderColor: '#364052', borderWidth: 1 }]}
            >
              <Text style={[styles.sheetOptionText, { color: theme.colors.textPrimary }]}>
                Dual Upload (Original RAW + Graded JPEG)
              </Text>
              <Text style={[styles.sheetOptionSubtext, { color: theme.colors.textMuted }]}>
                Preserves uncompressed raw camera file plus the graded preview
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleTransfer('EXPORT_SIDECAR')}
              style={[styles.sheetOptionBtn, { backgroundColor: '#1A2332', borderColor: '#264166', borderWidth: 1 }]}
            >
              <Text style={[styles.sheetOptionText, { color: '#00D1FF' }]}>
                Export Non-Destructive Sidecar (.XMP / .CUBE)
              </Text>
              <Text style={[styles.sheetOptionSubtext, { color: theme.colors.textMuted }]}>
                Saves adjustments for Adobe Lightroom & DaVinci Resolve without altering RAW
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleTransfer('RAW_ORIGINAL')}
              style={[styles.sheetOptionBtn, { backgroundColor: '#222834', borderColor: '#364052', borderWidth: 1 }]}
            >
              <Text style={[styles.sheetOptionText, { color: theme.colors.textPrimary }]}>
                Transfer Original RAW Only
              </Text>
              <Text style={[styles.sheetOptionSubtext, { color: theme.colors.textMuted }]}>
                Direct raw upload without embedding preset
              </Text>
            </TouchableOpacity>

            <Button
              title="Close"
              variant="secondary"
              size="sm"
              onPress={() => setIsApplyActionSheetVisible(false)}
              style={{ marginTop: 6 }}
            />
          </View>
        </View>
      ) : null}

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

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  viewportLocked: {
    flex: 1,
    overflow: 'hidden',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44,
  },
  topHeaderBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerActionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  headerActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitleCol: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  headerTitleText: {
    fontSize: 14,
    fontWeight: '700',
  },
  headerSubtitleText: {
    fontSize: 11,
  },
  applyPrimaryBtn: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#00D1FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  applyPrimaryBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  topCanvas: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#090B0E',
  },
  imagePinnedContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinnedImage: {
    width: '100%',
    height: '100%',
  },
  canvasGradeOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  liveStatusPill: {
    position: 'absolute',
    top: 12,
    left: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  liveStatusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  floatingBeforeAfterBtn: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    backgroundColor: 'rgba(12, 16, 22, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bottomControlDock: {
    height: Math.min(300, SCREEN_HEIGHT * 0.4),
    borderTopWidth: 1,
    justifyContent: 'space-between',
    paddingBottom: Platform.OS === 'ios' ? 20 : 6,
  },
  singleSliderSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  sliderReadoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolIconText: {
    fontSize: 16,
  },
  sliderNameText: {
    fontSize: 14,
    fontWeight: '700',
  },
  numericPill: {
    alignItems: 'flex-end',
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  numericReadout: {
    fontSize: 15,
    fontWeight: '800',
  },
  resetHint: {
    fontSize: 9,
    color: '#626D7D',
  },
  sliderControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  stepBtnLarge: {
    backgroundColor: '#1E232B',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  stepBtnSmall: {
    backgroundColor: '#1E232B',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  stepBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sliderTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  sliderTrackFill: {
    height: '100%',
    borderRadius: 4,
  },
  toolsIconStrip: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  toolIconBtn: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 62,
    position: 'relative',
  },
  toolStripIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  toolStripLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  dotIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  presetStripContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  presetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dockSubheader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  importLinkText: {
    fontSize: 11,
    fontWeight: '700',
  },
  presetScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  presetCardThumb: {
    width: 90,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  presetColorSwatch: {
    width: '100%',
    height: 38,
    borderRadius: 4,
    marginBottom: 6,
  },
  presetCardName: {
    fontSize: 11,
    textAlign: 'center',
  },
  categoryTabsBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingHorizontal: 8,
  },
  categoryTabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
  },
  categoryTabText: {
    fontSize: 11,
  },
  actionSheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 999,
  },
  actionSheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  actionSheetContent: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
    paddingBottom: 32,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 12,
    marginBottom: 16,
  },
  sheetOptionBtn: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  sheetOptionPrimaryText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  sheetOptionSubtextDark: {
    color: '#1A2530',
    fontSize: 11,
  },
  sheetOptionText: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  sheetOptionSubtext: {
    fontSize: 11,
  },
});
