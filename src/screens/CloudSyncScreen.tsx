/**
 * AeroShutter Cloud Sync Screen
 * Google Drive integration, active queue monitoring, upload speedometer, and retry controls.
 */

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useApp } from '../context/AppContext';
import { useUpload } from '../context/UploadContext';
import { Header } from '../components/common/Header';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { UploadSpeedometer } from '../components/upload/UploadSpeedometer';
import { StorageQuotaBar } from '../components/upload/StorageQuotaBar';
import { UploadQueueList } from '../components/upload/UploadQueueList';
import { googleAuthService } from '../services/cloud/GoogleAuthService';

export const CloudSyncScreen: React.FC = () => {
  const { theme } = useApp();
  const { queueState, pauseUploads, resumeUploads, retryAllFailed } = useUpload();
  const account = googleAuthService.getCurrentAccount();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title="Cloud Sync"
        subtitle="Automatic Google Drive Resumable Upload"
      />

      <View style={styles.topSection}>
        {/* Google Drive Account Card */}
        <Card style={styles.accountCard}>
          <View style={styles.accountRow}>
            {account?.photoUrl ? (
              <Image source={{ uri: account.photoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.surfaceActive }]}>
                <Text style={styles.avatarLetter}>G</Text>
              </View>
            )}

            <View style={styles.accountDetails}>
              <Text style={[styles.accountName, { color: theme.colors.textPrimary }]}>
                {account?.displayName || 'Google Drive'}
              </Text>
              <Text style={[styles.accountEmail, { color: theme.colors.textSecondary }]}>
                {account?.email || 'Not connected'}
              </Text>
            </View>

            <Badge
              label={account ? 'CONNECTED' : 'OFFLINE'}
              variant={account ? 'success' : 'secondary'}
              size="sm"
            />
          </View>
        </Card>

        {/* Live Upload Speedometer */}
        <UploadSpeedometer />

        {/* Storage Quota Bar */}
        <StorageQuotaBar />

        {/* Controls Bar */}
        <View style={styles.controlsRow}>
          <Button
            title={queueState.isPaused ? '▶ Resume Queue' : '⏸ Pause Queue'}
            variant={queueState.isPaused ? 'primary' : 'secondary'}
            size="sm"
            onPress={queueState.isPaused ? resumeUploads : pauseUploads}
            style={styles.controlBtn}
          />
          {queueState.totalFailedCount > 0 ? (
            <Button
              title={`Retry ${queueState.totalFailedCount} Failed`}
              variant="danger"
              size="sm"
              onPress={retryAllFailed}
              style={styles.controlBtn}
            />
          ) : null}
        </View>
      </View>

      <View style={styles.queueHeaderRow}>
        <Text style={[styles.queueHeaderTitle, { color: theme.colors.textMuted }]}>
          ACTIVE UPLOAD QUEUE ({queueState.tasks.length})
        </Text>
      </View>

      <View style={styles.queueContainer}>
        <UploadQueueList />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    paddingBottom: 4,
  },
  accountCard: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarLetter: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00D1FF',
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 13,
    fontWeight: '700',
  },
  accountEmail: {
    fontSize: 11,
    marginTop: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  controlBtn: {
    marginRight: 8,
  },
  queueHeaderRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  queueHeaderTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  queueContainer: {
    flex: 1,
  },
});
