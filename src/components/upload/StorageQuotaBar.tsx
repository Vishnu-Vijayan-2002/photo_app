import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useApp } from '../../context/AppContext';
import { useUpload } from '../../context/UploadContext';
import { ProgressBar } from '../common/ProgressBar';
import { photoStorageManager } from '../../services/storage/PhotoStorageManager';

export const StorageQuotaBar: React.FC = () => {
  const { theme } = useApp();
  const { account } = useUpload();

  if (!account || !account.storageQuota) return null;

  const used = account.storageQuota.usageBytes || 0;
  const limit = account.storageQuota.limitBytes || 16106127360; // 15 GB Google Drive standard quota
  const percentage = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={styles.labelRow}>
        <Text style={[styles.title, { color: theme.colors.textSecondary }]}>Google Drive Storage</Text>
        <Text style={[styles.fraction, { color: theme.colors.textPrimary }]}>
          {photoStorageManager.formatBytes(used)} of {photoStorageManager.formatBytes(limit)} ({percentage}%)
        </Text>
      </View>
      <ProgressBar
        progress={percentage}
        height={6}
        color={percentage > 90 ? theme.colors.error : theme.colors.primary}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
  },
  fraction: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
});

