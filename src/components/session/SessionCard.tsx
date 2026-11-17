import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useApp } from '../../context/AppContext';
import { Session } from '../../types/session';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { photoStorageManager } from '../../services/storage/PhotoStorageManager';

interface SessionCardProps {
  session: Session;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({ session, isActive, onSelect, onDelete }) => {
  const { theme } = useApp();

  const formattedDate = new Date(session.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Card
      style={[
        styles.card,
        {
          borderColor: isActive ? theme.colors.primary : theme.colors.border,
          borderWidth: isActive ? 1.5 : 1,
        },
      ]}
    >
      <TouchableOpacity activeOpacity={0.8} onPress={onSelect}>
        <View style={styles.headerRow}>
          <View style={styles.titleCol}>
            <View style={styles.nameBadgeRow}>
              <Text style={[styles.sessionName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                {session.name}
              </Text>
              {isActive ? <Badge label="ACTIVE" variant="primary" size="sm" /> : null}
            </View>
            <Text style={[styles.sessionDate, { color: theme.colors.textMuted }]}>{formattedDate}</Text>
          </View>
        </View>

        {session.description ? (
          <Text style={[styles.description, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {session.description}
          </Text>
        ) : null}

        <View style={[styles.statsRow, { borderTopColor: theme.colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>PHOTOS</Text>
            <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>{session.totalPhotos}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>SYNCED</Text>
            <Text style={[styles.statValue, { color: theme.colors.success }]}>{session.uploadedPhotos}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>PENDING</Text>
            <Text style={[styles.statValue, { color: theme.colors.warning }]}>{session.pendingPhotos}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>STORAGE</Text>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {photoStorageManager.formatBytes(session.totalBytes)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleCol: {
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionName: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  sessionDate: {
    fontSize: 11,
    marginTop: 2,
  },
  description: {
    fontSize: 12,
    marginVertical: 8,
    lineHeight: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 1,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
});

