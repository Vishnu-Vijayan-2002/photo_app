import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useApp } from '../../context/AppContext';
import { Photo } from '../../types/photo';
import { Badge } from '../common/Badge';
import { ProgressBar } from '../common/ProgressBar';
import { photoStorageManager } from '../../services/storage/PhotoStorageManager';

interface PhotoCardProps {
  photo: Photo;
  onPress: () => void;
  isSelected?: boolean;
  isSelectable?: boolean;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({ photo, onPress, isSelected = false, isSelectable = false }) => {
  const { theme } = useApp();

  const getStatusBadge = () => {
    switch (photo.uploadStatus) {
      case 'COMPLETED':
        return <Badge label="Synced" variant="success" size="sm" />;
      case 'UPLOADING':
        return <Badge label={`${photo.uploadProgress || 0}%`} variant="primary" size="sm" />;
      case 'FAILED':
        return <Badge label="Failed" variant="error" size="sm" />;
      case 'PENDING':
        return <Badge label="Queued" variant="warning" size="sm" />;
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
          borderWidth: isSelected ? 2 : 1,
        },
      ]}
    >
      <View style={styles.imageContainer}>
        {photo.thumbnailPath ? (
          <Image source={{ uri: photo.thumbnailPath }} style={styles.thumbnail} resizeMode="cover" />
        ) : photo.localPath ? (
          <Image source={{ uri: photo.localPath }} style={styles.thumbnail} resizeMode="cover" />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: theme.colors.surfaceActive }]} />
        )}

        {isSelectable ? (
          <View
            style={[
              styles.checkboxBadge,
              {
                backgroundColor: isSelected ? theme.colors.primary : 'rgba(0,0,0,0.5)',
                borderColor: isSelected ? theme.colors.primary : '#FFFFFF',
              },
            ]}
          >
            <Text style={styles.checkboxText}>{isSelected ? '✓' : ''}</Text>
          </View>
        ) : (
          <View style={styles.badgeTopLeft}>
            <Badge
              label={photo.isRaw ? `RAW • ${photo.rawFormat}` : 'JPEG'}
              variant={photo.isRaw ? 'raw' : 'jpeg'}
              size="sm"
            />
          </View>
        )}

        <View style={styles.badgeTopRight}>{getStatusBadge()}</View>

        {photo.uploadStatus === 'UPLOADING' && photo.uploadProgress !== undefined ? (
          <View style={styles.progressContainer}>
            <ProgressBar progress={photo.uploadProgress} height={3} />
          </View>
        ) : null}
      </View>

      <View style={styles.infoContainer}>
        <Text style={[styles.fileName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
          {photo.fileName}
        </Text>
        <View style={styles.detailsRow}>
          <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
            {photoStorageManager.formatBytes(photo.fileSize)}
          </Text>
          {photo.exif?.aperture ? (
            <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
              {photo.exif.aperture} • {photo.exif.shutterSpeed}
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 10,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 3 / 2,
    position: 'relative',
    backgroundColor: '#0A0D11',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
  },
  checkboxBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  badgeTopLeft: {
    position: 'absolute',
    top: 6,
    left: 6,
  },
  badgeTopRight: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  infoContainer: {
    padding: 8,
  },
  fileName: {
    fontSize: 12,
    fontWeight: '700',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 3,
  },
  metaText: {
    fontSize: 10,
    fontWeight: '500',
  },
});

