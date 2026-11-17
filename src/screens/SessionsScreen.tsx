/**
 * AeroShutter Sessions Screen
 * Manage shooting projects, client folders, and cloud synchronization targets.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useApp } from '../context/AppContext';
import { useSession } from '../context/SessionContext';
import { Header } from '../components/common/Header';
import { Button } from '../components/common/Button';
import { SessionCard } from '../components/session/SessionCard';
import { CreateSessionModal } from '../components/session/CreateSessionModal';
import { Icon } from '../components/common/Icon';

export const SessionsScreen: React.FC = () => {
  const { theme } = useApp();
  const { sessions, activeSession, setActiveSession, deleteSession } = useSession();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title="Sessions"
        subtitle={`${sessions.length} Projects & Shoots`}
        rightAction={
          <Button
            title="+ New Session"
            variant="primary"
            size="sm"
            onPress={() => setModalVisible(true)}
          />
        }
      />

      {sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={{ marginBottom: 14 }}>
            <Icon name="sessions" size={36} color={theme.colors.textMuted} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No Sessions Yet</Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
            Create your first session to organize tethered photos and automatic cloud folders.
          </Text>
          <Button
            title="Create Session"
            variant="primary"
            onPress={() => setModalVisible(true)}
            style={styles.emptyBtn}
          />
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SessionCard
              session={item}
              isActive={item.id === activeSession?.id}
              onSelect={() => setActiveSession(item.id)}
              onDelete={() => deleteSession(item.id)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <CreateSessionModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingVertical: 10,
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 280,
  },
  emptyBtn: {
    marginTop: 20,
  },
});

