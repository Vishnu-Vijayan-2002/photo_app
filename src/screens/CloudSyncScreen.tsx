/**
 * AeroShutter Cloud Sync Screen
 * Google Drive integration, active queue monitoring, upload speedometer, and retry controls.
 * Supports connecting real Google accounts and 1-tap switching between upload modes.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useApp } from '../context/AppContext';
import { useUpload } from '../context/UploadContext';
import { Header } from '../components/common/Header';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { GoogleAvatar } from '../components/common/GoogleAvatar';
import { UploadSpeedometer } from '../components/upload/UploadSpeedometer';
import { StorageQuotaBar } from '../components/upload/StorageQuotaBar';
import { UploadQueueList } from '../components/upload/UploadQueueList';
import { UploadModeSelector } from '../components/upload/UploadModeSelector';
import { GoogleAccountModal } from '../components/upload/GoogleAccountModal';
import { PresetConfigModal } from '../components/upload/PresetConfigModal';

export const CloudSyncScreen: React.FC = () => {
  const { theme } = useApp();
  const { queueState, pauseUploads, resumeUploads, retryAllFailed, account } = useUpload();
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [presetModalVisible, setPresetModalVisible] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title="Cloud Sync"
        subtitle="Automatic Google Drive Resumable Upload"
        rightAction={
          <Button
            title={account ? 'Account' : '+ Connect'}
            variant={account ? 'secondary' : 'primary'}
            size="sm"
            onPress={() => setAccountModalVisible(true)}
          />
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        <View style={styles.topSection}>
          {/* Google Drive Account Card (Clickable to manage / connect) */}
          <TouchableOpacity activeOpacity={0.8} onPress={() => setAccountModalVisible(true)}>
            <Card style={styles.accountCard}>
              <View style={styles.accountRow}>
                <GoogleAvatar
                  photoUrl={account?.photoUrl}
                  displayName={account?.displayName}
                  size={46}
                />

                <View style={styles.accountDetails}>
                  <Text style={[styles.accountName, { color: theme.colors.textPrimary }]}>
                    {account?.displayName || 'Google Drive'}
                  </Text>
                  <Text style={[styles.accountEmail, { color: theme.colors.textSecondary }]}>
                    {account?.email || 'Tap to connect your Google Account'}
                  </Text>
                </View>

                <Badge
                  label={account ? 'CONNECTED' : 'DISCONNECTED'}
                  variant={account ? 'success' : 'secondary'}
                  size="sm"
                />
              </View>
            </Card>
          </TouchableOpacity>

          {/* 3 Upload Modes (Auto-Upload, Manual Select, Preset Mode) */}
          <UploadModeSelector onOpenPresetConfig={() => setPresetModalVisible(true)} />

          {/* Live Upload Speedometer */}
          <UploadSpeedometer />

          {/* Storage Quota Bar */}
          <StorageQuotaBar />

          {/* Controls Bar */}
          <View style={styles.controlsRow}>
            <Button
              title={queueState.isPaused ? 'Resume Queue' : 'Pause Queue'}
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
      </ScrollView>

      {/* Google Account Connection Modal */}
      <GoogleAccountModal
        visible={accountModalVisible}
        onClose={() => setAccountModalVisible(false)}
      />

      {/* Preset Mode Configuration Modal */}
      <PresetConfigModal
        visible={presetModalVisible}
        onClose={() => setPresetModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  topSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  accountCard: {
    padding: 12,
    marginBottom: 14,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: '700',
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 14,
    fontWeight: '700',
  },
  accountEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 16,
  },
  controlBtn: {
    flex: 1,
  },
  queueHeaderRow: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  queueHeaderTitle: {
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '700',
  },
  queueContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    minHeight: 200,
  },
});
