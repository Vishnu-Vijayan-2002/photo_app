import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useApp } from '../../context/AppContext';
import { ExifData } from '../../types/camera';

interface ExifInspectorProps {
  exif?: ExifData;
}

export const ExifInspector: React.FC<ExifInspectorProps> = ({ exif }) => {
  const { theme } = useApp();

  if (!exif) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.noExif, { color: theme.colors.textMuted }]}>No EXIF metadata available</Text>
      </View>
    );
  }

  const items = [
    { label: 'SHUTTER', value: exif.shutterSpeed || '1/250s' },
    { label: 'APERTURE', value: exif.aperture || 'f/2.8' },
    { label: 'ISO', value: exif.iso ? `ISO ${exif.iso}` : 'ISO 400' },
    { label: 'FOCAL', value: exif.focalLength || '50mm' },
    { label: 'CAMERA', value: exif.model || 'Mirrorless' },
    { label: 'LENS', value: exif.lens || '24-70mm' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <Text style={[styles.header, { color: theme.colors.textMuted }]}>EXIF TELEMETRY</Text>
      <View style={styles.grid}>
        {items.map((item, idx) => (
          <View key={idx} style={[styles.item, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{item.label}</Text>
            <Text style={[styles.value, { color: theme.colors.textPrimary }]} numberOfLines={1}>
              {item.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginVertical: 6,
  },
  header: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  item: {
    width: '33.33%',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  noExif: {
    fontSize: 12,
    textAlign: 'center',
    padding: 10,
  },
});
