import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useApp } from '../../context/AppContext';
import { Photo } from '../../types/photo';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { ExifInspector } from './ExifInspector';
import { HistogramView } from './HistogramView';
import { ProgressBar } from '../common/ProgressBar';
import { Button } from '../common/Button';
import { photoStorageManager } from '../../services/storage/PhotoStorageManager';
import { useUpload } from '../../context/UploadContext';

interface PhotoDetailModalProps {
  photo: Photo | null;
  visible: boolean;
  onClose: () => void;
  onOpenEditor?: (photo: Photo) => void;
}

export const PhotoDetailModal: React.FC<PhotoDetailModalProps> = ({ photo, visible, onClose, onOpenEditor }) => {
  const { theme } = useApp();
  const { retryTask } = useUpload();

  if (!photo) return null;

  return (
    <Modal visible={visible} onClose={onClose} title={photo.fileName}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        <View style={styles.previewContainer}>
          {photo.thumbnailPath ? (
            <Image source={{ uri: photo.thumbnailPath }} style={styles.previewImage} resizeMode="contain" />
          ) : (
            <View style={[styles.placeholder, { backgroundColor: theme.colors.surfaceActive }]} />
          )}
        </View>

        {/* Quick Action to open Color Grade Studio */}
        {onOpenEditor ? (
          <View style={styles.editorActionRow}>
            <Button
              title="🎨 Presets & Color Grade"
              variant="primary"
              size="sm"
              onPress={() => {
                onClose();
                onOpenEditor(photo);
              }}
              style={styles.editorBtn}
            />
          </View>
        ) : null}

        <View style={styles.badgesRow}>
          <Badge
            label={photo.isRaw ? `RAW (${photo.rawFormat})` : 'HIGH-RES JPEG'}
            variant={photo.isRaw ? 'raw' : 'jpeg'}
            size="md"
          />
          <Badge
            label={photo.uploadStatus || 'PENDING'}
            variant={
              photo.uploadStatus === 'COMPLETED'
                ? 'success'
                : photo.uploadStatus === 'FAILED'
                ? 'error'
                : 'primary'
            }
            size="md"
          />
        </View>

        {photo.uploadStatus === 'UPLOADING' ? (
          <View style={styles.uploadProgressSection}>
            <View style={styles.progressLabelRow}>
              <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>Cloud Uploading</Text>
              <Text style={[styles.progressPercent, { color: theme.colors.primary }]}>
                {photo.uploadProgress || 0}%
              </Text>
            </View>
            <ProgressBar progress={photo.uploadProgress || 0} height={6} />
          </View>
        ) : null}

        {photo.uploadStatus === 'FAILED' ? (
          <View style={[styles.errorBox, { backgroundColor: theme.colors.errorMuted }]}>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              Upload failed due to network disruption.
            </Text>
            <Button
              title="Retry Upload"
              size="sm"
              variant="danger"
              onPress={() => retryTask('task_' + photo.id)}
              style={styles.retryBtn}
            />
          </View>
        ) : null}

        <View style={[styles.metaSummary, { borderColor: theme.colors.border }]}>
          <View style={styles.metaCol}>
            <Text style={[styles.metaTitle, { color: theme.colors.textMuted }]}>FILE SIZE</Text>
            <Text style={[styles.metaVal, { color: theme.colors.textPrimary }]}>
              {photoStorageManager.formatBytes(photo.fileSize)}
            </Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={[styles.metaTitle, { color: theme.colors.textMuted }]}>DIMENSIONS</Text>
            <Text style={[styles.metaVal, { color: theme.colors.textPrimary }]}>
              {photo.width || 7008} × {photo.height || 4672}
            </Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={[styles.metaTitle, { color: theme.colors.textMuted }]}>FORMAT</Text>
            <Text style={[styles.metaVal, { color: theme.colors.textPrimary }]}>{photo.rawFormat}</Text>
          </View>
        </View>

        <HistogramView />

        <ExifInspector exif={photo.exif} />
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  scroll: {
    maxHeight: 520,
  },
  previewContainer: {
    width: '100%',
    height: 220,
    backgroundColor: '#090B0E',
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
  },
  editorActionRow: {
    marginVertical: 10,
  },
  editorBtn: {
    width: '100%',
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  uploadProgressSection: {
    marginBottom: 10,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: '700',
  },
  errorBox: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  retryBtn: {
    alignSelf: 'flex-start',
  },
  metaSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    marginVertical: 6,
  },
  metaCol: {
    alignItems: 'center',
  },
  metaTitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metaVal: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
});
