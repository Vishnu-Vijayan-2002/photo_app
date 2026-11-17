/**
 * AeroShutter Preset Mode Configuration Modal
 * Configures Option 3: Pre-configured rules for auto-grading, target Drive folders,
 * dual transfer (RAW + Graded), and network constraints.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useApp } from '../../context/AppContext';
import { useUpload } from '../../context/UploadContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { BUILT_IN_PRESETS } from '../../services/preset/PresetManager';
import { PhotoPreset } from '../../types/preset';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const PresetConfigModal: React.FC<Props> = ({ visible, onClose }) => {
  const { theme } = useApp();
  const { presetConfig, updatePresetConfig } = useUpload();

  const [workflow, setWorkflow] = useState(presetConfig.transferWorkflow);
  const [selectedPresetId, setSelectedPresetId] = useState(presetConfig.selectedPresetId);
  const [wifiOnly, setWifiOnly] = useState(presetConfig.wifiOnly);
  const [maxConcurrency, setMaxConcurrency] = useState(presetConfig.maxConcurrency);

  const handleSave = () => {
    updatePresetConfig({
      transferWorkflow: workflow,
      selectedPresetId,
      wifiOnly,
      maxConcurrency,
    });
    onClose();
  };

  const workflows: Array<{ id: typeof workflow; label: string; desc: string }> = [
    { id: 'DUAL_TRANSFER', label: 'Dual Upload (RAW + Graded)', desc: 'Uploads both original uncompressed RAW and graded JPEG.' },
    { id: 'GRADED_ONLY', label: 'Graded JPEG Only', desc: 'Applies selected preset and uploads high-res JPEG.' },
    { id: 'RAW_ONLY', label: 'Original RAW Only', desc: 'Direct upload of camera RAW without color modification.' },
  ];

  return (
    <Modal visible={visible} onClose={onClose} title="Preset Mode Upload Settings">
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {/* Workflow Selection */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>
          TRANSFER & GRADING WORKFLOW
        </Text>
        {workflows.map((w) => {
          const isSelected = workflow === w.id;
          return (
            <TouchableOpacity
              key={w.id}
              style={[
                styles.optionCard,
                {
                  backgroundColor: isSelected ? theme.colors.surfaceActive : theme.colors.surface,
                  borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                },
              ]}
              onPress={() => setWorkflow(w.id)}
            >
              <View style={styles.optionHeader}>
                <Text style={[styles.optionLabel, { color: theme.colors.textPrimary, fontWeight: isSelected ? '700' : '500' }]}>
                  {w.label}
                </Text>
                {isSelected ? <Text style={{ color: theme.colors.primary }}>✓</Text> : null}
              </View>
              <Text style={[styles.optionDesc, { color: theme.colors.textSecondary }]}>
                {w.desc}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Selected Preset (if workflow requires grading) */}
        {workflow !== 'RAW_ONLY' ? (
          <View style={styles.presetSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>
              AUTO-APPLIED COLOR PRESET
            </Text>
            <View style={styles.presetGrid}>
              {BUILT_IN_PRESETS.map((preset: PhotoPreset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <TouchableOpacity
                    key={preset.id}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: isSelected ? theme.colors.primary : theme.colors.surfaceActive,
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                    onPress={() => setSelectedPresetId(preset.id)}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        { color: isSelected ? '#FFFFFF' : theme.colors.textSecondary, fontWeight: isSelected ? '700' : '500' },
                      ]}
                      numberOfLines={1}
                    >
                      {preset.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Network & Concurrency Settings */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>
          NETWORK & PERFORMANCE
        </Text>
        <View style={[styles.settingRow, { borderColor: theme.colors.border }]}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>Wi-Fi Only</Text>
            <Text style={[styles.settingDesc, { color: theme.colors.textSecondary }]}>
              Pause uploads on cellular data to prevent mobile plan overages.
            </Text>
          </View>
          <Switch value={wifiOnly} onValueChange={setWifiOnly} />
        </View>

        <View style={[styles.settingRow, { borderColor: theme.colors.border }]}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
              Concurrent Upload Streams ({maxConcurrency})
            </Text>
            <Text style={[styles.settingDesc, { color: theme.colors.textSecondary }]}>
              Simultaneous file uploads to maximize bandwidth utilization.
            </Text>
          </View>
          <View style={styles.concurrencyRow}>
            {[1, 2, 3, 4].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.concurrencyBtn,
                  {
                    backgroundColor: maxConcurrency === num ? theme.colors.primary : theme.colors.surfaceActive,
                  },
                ]}
                onPress={() => setMaxConcurrency(num)}
              >
                <Text
                  style={{
                    color: maxConcurrency === num ? '#FFFFFF' : theme.colors.textPrimary,
                    fontWeight: '700',
                    fontSize: 12,
                  }}
                >
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          title="Save Preset Configuration"
          variant="primary"
          size="md"
          onPress={handleSave}
          style={styles.saveBtn}
        />
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  scroll: {
    maxHeight: 460,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 8,
  },
  optionCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionLabel: {
    fontSize: 13,
  },
  optionDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  presetSection: {
    marginTop: 4,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  presetChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  settingDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  concurrencyRow: {
    flexDirection: 'row',
    gap: 6,
  },
  concurrencyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    marginTop: 20,
    marginBottom: 10,
  },
});
