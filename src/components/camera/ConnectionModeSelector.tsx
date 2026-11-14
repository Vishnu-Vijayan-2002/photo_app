import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useApp } from '../../context/AppContext';
import { useCamera } from '../../context/CameraContext';
import { ConnectionMode } from '../../types/camera';

interface ModeOption {
  mode: ConnectionMode;
  title: string;
  subtitle: string;
  tag: string;
}

const MODES: ModeOption[] = [
  {
    mode: 'FTP_WIFI',
    title: 'Wi-Fi / Hotspot FTP',
    subtitle: 'Direct auto-transfer for Sony, Canon, Nikon & Fuji',
    tag: 'WIRELESS',
  },
  {
    mode: 'USB_OTG',
    title: 'USB-C Cable Tether',
    subtitle: 'Ultra high-speed PTP transfer via OTG cable',
    tag: 'WIRED',
  },
  {
    mode: 'HOT_FOLDER',
    title: 'Storage Hot-Folder',
    subtitle: 'Import from SD Card reader or DCIM folder',
    tag: 'STORAGE',
  },
  {
    mode: 'MOCK_SIMULATOR',
    title: 'Camera Simulator',
    subtitle: 'Burst testing with Sony A7 IV & Canon R5 EXIF',
    tag: 'TESTING',
  },
];

export const ConnectionModeSelector: React.FC = () => {
  const { theme } = useApp();
  const { connectionMode, setConnectionMode } = useCamera();

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>CONNECTION PROTOCOL</Text>
      <View style={styles.grid}>
        {MODES.map((item) => {
          const isSelected = connectionMode === item.mode;
          return (
            <TouchableOpacity
              key={item.mode}
              activeOpacity={0.8}
              onPress={() => setConnectionMode(item.mode)}
              style={[
                styles.modeCard,
                {
                  backgroundColor: isSelected ? theme.colors.surfaceActive : theme.colors.card,
                  borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.tagBadge,
                    {
                      backgroundColor: isSelected ? theme.colors.primaryMuted : 'rgba(255,255,255,0.06)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tagText,
                      { color: isSelected ? theme.colors.primary : theme.colors.textMuted },
                    ]}
                  >
                    {item.tag}
                  </Text>
                </View>
                {isSelected ? <View style={[styles.selectedDot, { backgroundColor: theme.colors.primary }]} /> : null}
              </View>
              <Text
                style={[
                  styles.modeTitle,
                  { color: isSelected ? theme.colors.primary : theme.colors.textPrimary },
                ]}
              >
                {item.title}
              </Text>
              <Text style={[styles.modeSubtitle, { color: theme.colors.textSecondary }]}>{item.subtitle}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginVertical: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  modeCard: {
    width: '48%',
    margin: '1%',
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '800',
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modeTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  modeSubtitle: {
    fontSize: 11,
    lineHeight: 14,
  },
});
