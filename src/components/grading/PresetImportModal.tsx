import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ColorGradingAdjustments } from '../../types/preset';
import { presetManager } from '../../services/preset/PresetManager';
import { ColorGradingEngine } from '../../services/image/ColorGradingEngine';

interface PresetImportModalProps {
  visible: boolean;
  onClose: () => void;
  currentAdjustments: ColorGradingAdjustments;
  onPresetImported: (presetId: string) => void;
}

export const PresetImportModal: React.FC<PresetImportModalProps> = ({
  visible,
  onClose,
  currentAdjustments,
  onPresetImported,
}) => {
  const { theme } = useApp();
  const [activeTab, setActiveTab] = useState<'SAVE_CURRENT' | 'PASTE_XMP'>('SAVE_CURRENT');
  const [presetName, setPresetName] = useState('');
  const [xmpContent, setXmpContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSaveCurrent = () => {
    if (!presetName.trim()) {
      setError('Please provide a preset name');
      return;
    }

    const saved = presetManager.saveCustomPreset(presetName.trim(), currentAdjustments);
    onPresetImported(saved.id);
    setPresetName('');
    setError(null);
    onClose();
  };

  const handleImportXmp = () => {
    if (!xmpContent.trim()) {
      setError('Please paste Lightroom .xmp or .cube text');
      return;
    }

    try {
      let imported;
      if (xmpContent.includes('TITLE') || xmpContent.includes('LUT_3D_SIZE')) {
        imported = ColorGradingEngine.parseCubeLut(xmpContent, presetName || 'Custom 3D LUT');
      } else if (xmpContent.trim().startsWith('{')) {
        imported = ColorGradingEngine.importFromJson(xmpContent);
      } else {
        imported = ColorGradingEngine.parseXmpPreset(xmpContent, presetName || 'Imported XMP Preset');
      }

      presetManager.addImportedPreset(imported);
      onPresetImported(imported.id);
      setXmpContent('');
      setPresetName('');
      setError(null);
      onClose();
    } catch (err: any) {
      setError('Failed to parse preset: ' + (err.message || 'Invalid format'));
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Custom Presets">
      <View style={styles.tabRow}>
        <TouchableOpacity
          onPress={() => {
            setActiveTab('SAVE_CURRENT');
            setError(null);
          }}
          style={[
            styles.tabItem,
            { borderBottomColor: activeTab === 'SAVE_CURRENT' ? theme.colors.primary : 'transparent' },
          ]}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'SAVE_CURRENT' ? theme.colors.primary : theme.colors.textSecondary },
            ]}
          >
            Save Current Grade
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setActiveTab('PASTE_XMP');
            setError(null);
          }}
          style={[
            styles.tabItem,
            { borderBottomColor: activeTab === 'PASTE_XMP' ? theme.colors.primary : 'transparent' },
          ]}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'PASTE_XMP' ? theme.colors.primary : theme.colors.textSecondary },
            ]}
          >
            Import .XMP / .CUBE
          </Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={[styles.errorBox, { backgroundColor: theme.colors.errorMuted }]}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
        </View>
      ) : null}

      {activeTab === 'SAVE_CURRENT' ? (
        <View style={styles.content}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>PRESET NAME</Text>
          <TextInput
            placeholder="e.g. Moody Wedding Ceremony, Sunset Look"
            placeholderTextColor={theme.colors.textMuted}
            value={presetName}
            onChangeText={setPresetName}
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surfaceActive,
                color: theme.colors.textPrimary,
                borderColor: theme.colors.border,
              },
            ]}
          />

          <View style={styles.actions}>
            <Button title="Cancel" variant="ghost" onPress={onClose} style={styles.cancelBtn} />
            <Button
              title="Save Preset"
              variant="primary"
              disabled={!presetName.trim()}
              onPress={handleSaveCurrent}
            />
          </View>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>PRESET NAME (OPTIONAL)</Text>
          <TextInput
            placeholder="e.g. My Signature Film Look"
            placeholderTextColor={theme.colors.textMuted}
            value={presetName}
            onChangeText={setPresetName}
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surfaceActive,
                color: theme.colors.textPrimary,
                borderColor: theme.colors.border,
                marginBottom: 10,
              },
            ]}
          />

          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>PASTE XMP, CUBE, OR JSON CODE</Text>
          <TextInput
            placeholder="Paste Adobe Lightroom <xmp:crs...> XML, .cube LUT, or JSON preset..."
            placeholderTextColor={theme.colors.textMuted}
            value={xmpContent}
            onChangeText={setXmpContent}
            multiline
            numberOfLines={6}
            style={[
              styles.textArea,
              {
                backgroundColor: theme.colors.surfaceActive,
                color: theme.colors.textPrimary,
                borderColor: theme.colors.border,
              },
            ]}
          />

          <View style={styles.actions}>
            <Button title="Cancel" variant="ghost" onPress={onClose} style={styles.cancelBtn} />
            <Button
              title="Import & Apply"
              variant="primary"
              disabled={!xmpContent.trim()}
              onPress={handleImportXmp}
            />
          </View>
        </View>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    marginBottom: 14,
  },
  tabItem: {
    paddingVertical: 8,
    marginRight: 16,
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    paddingVertical: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    marginBottom: 14,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    fontFamily: 'monospace',
    height: 110,
    textAlignVertical: 'top',
  },
  errorBox: {
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 16,
  },
  cancelBtn: {
    marginRight: 8,
  },
});
