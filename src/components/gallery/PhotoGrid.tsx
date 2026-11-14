import React from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import { useApp } from '../../context/AppContext';
import { Photo } from '../../types/photo';
import { PhotoCard } from './PhotoCard';

interface PhotoGridProps {
  photos: Photo[];
  onSelectPhoto: (photo: Photo) => void;
  emptyMessage?: string;
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({
  photos,
  onSelectPhoto,
  emptyMessage = 'No tethered photos in this session yet.',
}) => {
  const { theme } = useApp();

  if (photos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyIcon, { color: theme.colors.textMuted }]}>📷</Text>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>{emptyMessage}</Text>
        <Text style={[styles.emptySubtext, { color: theme.colors.textMuted }]}>
          Trigger your camera shutter or turn on 'Sim Burst' to stream photos into AeroShutter.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={photos}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <PhotoCard photo={item} onPress={() => onSelectPhoto(item)} />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: '48.5%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 260,
  },
  emptyIcon: {
    fontSize: 42,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
    maxWidth: 280,
  },
});
