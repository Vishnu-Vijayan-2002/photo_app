import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useApp } from '../../context/AppContext';
import { useUpload } from '../../context/UploadContext';
import { UploadTask } from '../../types/upload';
import { Badge } from '../common/Badge';
import { ProgressBar } from '../common/ProgressBar';
import { Button } from '../common/Button';
import { photoStorageManager } from '../../services/storage/PhotoStorageManager';

export const UploadQueueList: React.FC = () => {
  const { theme } = useApp();
  const { queueState, retryTask } = useUpload();

  const renderItem = ({ item }: { item: UploadTask }) => {
    const isUploading = item.status === 'UPLOADING';
    const isFailed = item.status === 'FAILED';

    const getBadgeLabel = () => {
      if (item.status === 'COMPLETED') return 'SYNCED';
      if (item.status === 'UPLOADING') return `${item.progressPercentage || 0}%`;
      if (item.status === 'PENDING') return 'QUEUED';
      if (item.status === 'PAUSED') return 'PAUSED';
      return 'FAILED';
    };

    return (
      <View style={[styles.taskItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={styles.topRow}>
          <View style={styles.fileInfo}>
            <Text style={[styles.fileName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
              {item.fileName}
            </Text>
            <Text style={[styles.fileSize, { color: theme.colors.textMuted }]}>
              {photoStorageManager.formatBytes(item.fileSize)}
            </Text>
          </View>
          <View style={styles.statusCol}>
            <Badge
              label={getBadgeLabel()}
              variant={
                item.status === 'COMPLETED'
                  ? 'success'
                  : item.status === 'FAILED'
                  ? 'error'
                  : item.status === 'UPLOADING'
                  ? 'primary'
                  : 'warning'
              }
              size="sm"
            />
          </View>
        </View>

        {isUploading ? (
          <View style={styles.progressRow}>
            <ProgressBar progress={item.progressPercentage} height={4} />
            <Text style={[styles.progressText, { color: theme.colors.primary }]}>{item.progressPercentage}%</Text>
          </View>
        ) : null}

        {isFailed ? (
          <View style={styles.errorRow}>
            <Text style={[styles.errorMsg, { color: theme.colors.error }]} numberOfLines={1}>
              {item.errorMessage || 'Upload failed'}
            </Text>
            <TouchableOpacity onPress={() => retryTask(item.id)} style={styles.retryBtn}>
              <Text style={[styles.retryText, { color: theme.colors.primary }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  };

  if (queueState.tasks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>No uploads in queue</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={queueState.tasks}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  taskItem: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fileInfo: {
    flex: 1,
    marginRight: 10,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '700',
  },
  fileSize: {
    fontSize: 11,
    marginTop: 2,
  },
  statusCol: {
    alignItems: 'flex-end',
  },
  progressRow: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '700',
    alignSelf: 'flex-end',
    marginTop: 3,
  },
  errorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  errorMsg: {
    fontSize: 11,
    flex: 1,
  },
  retryBtn: {
    marginLeft: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  retryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
});

