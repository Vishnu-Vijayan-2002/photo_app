import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useApp } from '../../context/AppContext';
import { PhotoPreset } from '../../types/preset';

interface PresetPickerProps {
  presets: PhotoPreset[];
  selectedPresetId: string | null;
  onSelectPreset: (preset: PhotoPreset) => void;
  onOpenImportModal: () => void;
}

export const PresetPicker: React.FC<PresetPickerProps> = ({
  presets,
  selectedPresetId,
  onSelectPreset,
  onOpenImportModal,
}) => {
  const { theme } = useApp();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: theme.colors.textMuted }]}>PRESETS</Text>
        <TouchableOpacity onPress={onOpenImportModal} style={styles.importBtn}>
          <Text style={[styles.importBtnText, { color: theme.colors.primary }]}>+ Import / Custom</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {presets.map((preset) => {
          const isSelected = selectedPresetId === preset.id;
          const chipColor = preset.previewThumbnailColor || theme.colors.primary;

          return (
            <TouchableOpacity
              key={preset.id}
              activeOpacity={0.8}
              onPress={() => onSelectPreset(preset)}
              style={[
                styles.presetItem,
                {
                  backgroundColor: isSelected ? theme.colors.surfaceActive : theme.colors.card,
                  borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
            >
              <View style={[styles.colorPreview, { backgroundColor: chipColor }]}>
                {isSelected ? <View style={styles.activeCheckmark} /> : null}
              </View>
              <Text
                style={[
                  styles.presetName,
                  {
                    color: isSelected ? theme.colors.primary : theme.colors.textPrimary,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}
                numberOfLines={1}
              >
                {preset.name}
              </Text>
              <Text style={[styles.categoryTag, { color: theme.colors.textMuted }]}>
                {preset.category}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  importBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  importBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scroll: {
    paddingHorizontal: 16,
  },
  presetItem: {
    width: 96,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  colorPreview: {
    width: '100%',
    height: 48,
    borderRadius: 6,
    marginBottom: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeCheckmark: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  presetName: {
    fontSize: 11,
    textAlign: 'center',
  },
  categoryTag: {
    fontSize: 9,
    marginTop: 2,
  },
});

