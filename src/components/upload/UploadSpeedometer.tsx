import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useApp } from '../../context/AppContext';
import { useUpload } from '../../context/UploadContext';
import { photoStorageManager } from '../../services/storage/PhotoStorageManager';

export const UploadSpeedometer: React.FC = () => {
  const { theme } = useApp();
  const { queueState } = useUpload();

  const formattedSpeed = photoStorageManager.formatBytes(queueState.metrics.currentBytesPerSecond) + '/s';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={styles.col}>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>UPLOAD SPEED</Text>
        <Text style={[styles.value, { color: theme.colors.primary }]}>{formattedSpeed}</Text>
      </View>
      <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
      <View style={styles.col}>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>IN FLIGHT</Text>
        <Text style={[styles.value, { color: theme.colors.textPrimary }]}>
          {queueState.activeConcurrency} / {queueState.maxConcurrency}
        </Text>
      </View>
      <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
      <View style={styles.col}>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>PENDING</Text>
        <Text style={[styles.value, { color: theme.colors.warning }]}>{queueState.totalPendingCount}</Text>
      </View>
      <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
      <View style={styles.col}>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>SYNCED</Text>
        <Text style={[styles.value, { color: theme.colors.success }]}>{queueState.totalCompletedCount}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  col: {
    alignItems: 'center',
    flex: 1,
  },
  label: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  divider: {
    width: 1,
    height: 24,
  },
});
