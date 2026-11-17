/**
 * AeroShutter Upload Mode Selector Component
 * Allows 1-tap switching between:
 *   1. Auto-Upload (Continuous real-time upload)
 *   2. Manual Selection (Selective gallery batch upload)
 *   3. Preset Mode (Pre-configured grading workflow & rules)
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useApp } from '../../context/AppContext';
import { useUpload } from '../../context/UploadContext';
import { UploadMode } from '../../types/upload';
import { Badge } from '../common/Badge';
import { Icon, IconName } from '../common/Icon';

interface Props {
  onOpenPresetConfig?: () => void;
}

export const UploadModeSelector: React.FC<Props> = ({ onOpenPresetConfig }) => {
  const { theme } = useApp();
  const { currentMode, setUploadMode, presetConfig } = useUpload();

  const modes: Array<{
    id: UploadMode;
    label: string;
    icon: IconName;
    description: string;
    badge: string;
  }> = [
    {
      id: 'AUTO_CONTINUOUS',
      label: 'Auto-Upload',
      icon: 'bolt',
      description: 'Photos upload directly to Google Drive as you shoot in real-time.',
      badge: 'CONTINUOUS',
    },
    {
      id: 'MANUAL_SELECT',
      label: 'Manual Select',
      icon: 'select',
      description: 'Select specific photos from your gallery and upload with one click.',
      badge: 'SELECTIVE',
    },
    {
      id: 'PRESET_MODE',
      label: 'Preset Mode',
      icon: 'presets',
      description: `Pre-configured rules (${presetConfig.transferWorkflow === 'DUAL_TRANSFER' ? 'Dual RAW+Graded' : presetConfig.transferWorkflow}) to target Drive folder.`,
      badge: 'CONFIGURED',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.colors.textMuted }]}>UPLOAD WORKFLOW MODE</Text>
        <Badge
          label={modes.find((m) => m.id === currentMode)?.badge || 'ACTIVE'}
          variant="primary"
          size="sm"
        />
      </View>

      <View style={styles.tabRow}>
        {modes.map((mode) => {
          const isSelected = currentMode === mode.id;
          const activeColor = isSelected ? theme.colors.primary : theme.colors.textSecondary;
          return (
            <TouchableOpacity
              key={mode.id}
              style={[
                styles.tabButton,
                {
                  backgroundColor: isSelected ? 'rgba(0, 210, 255, 0.12)' : theme.colors.surfaceActive,
                  borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                },
              ]}
              onPress={() => setUploadMode(mode.id)}
              activeOpacity={0.7}
            >
              <View style={styles.iconWrapper}>
                <Icon name={mode.icon} size={15} color={activeColor} />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: activeColor,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}
                numberOfLines={1}
              >
                {mode.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.descriptionBox, { backgroundColor: theme.colors.surfaceActive }]}>
        <Text style={[styles.descriptionText, { color: theme.colors.textSecondary }]}>
          {modes.find((m) => m.id === currentMode)?.description}
        </Text>

        {currentMode === 'PRESET_MODE' && onOpenPresetConfig ? (
          <TouchableOpacity onPress={onOpenPresetConfig} style={styles.configLink}>
            <Text style={[styles.configLinkText, { color: theme.colors.primary }]}>
              Configure Settings ⚙️
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '700',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  iconWrapper: {
    marginRight: 6,
  },
  tabLabel: {
    fontSize: 12,
  },
  descriptionBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  descriptionText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  configLink: {
    marginLeft: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  configLinkText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
