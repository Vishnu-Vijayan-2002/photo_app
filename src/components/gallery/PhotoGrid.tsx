import React from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import { useApp } from '../../context/AppContext';
import { Photo } from '../../types/photo';
import { PhotoCard } from './PhotoCard';
import { Icon } from '../common/Icon';

interface PhotoGridProps {
  photos: Photo[];
  onSelectPhoto: (photo: Photo) => void;
  emptyMessage?: string;
  isSelectable?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (photo: Photo) => void;
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({
  photos,
  onSelectPhoto,
  emptyMessage = 'No tethered photos in this session yet.',
  isSelectable = false,
  selectedIds = new Set(),
  onToggleSelect,
}) => {
  const { theme } = useApp();

  if (photos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={{ marginBottom: 12 }}>
          <Icon name="camera" size={32} color={theme.colors.textMuted} />
        </View>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>{emptyMessage}</Text>
        <Text style={[styles.emptySubtext, { color: theme.colors.textMuted }]}>
          Trigger your physical camera shutter to stream photos directly into TetherFlow.
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
            <PhotoCard
              photo={item}
              onPress={() => {
                if (isSelectable && onToggleSelect) {
                  onToggleSelect(item);
                } else {
                  onSelectPhoto(item);
                }
              }}
              isSelectable={isSelectable}
              isSelected={selectedIds.has(item.id)}
            />
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

