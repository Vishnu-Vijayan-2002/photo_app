import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useApp } from '../../context/AppContext';
import { useSession } from '../../context/SessionContext';

export const SessionSelector: React.FC = () => {
  const { theme } = useApp();
  const { sessions, activeSession, setActiveSession } = useSession();
  const [expanded, setExpanded] = useState(false);

  if (sessions.length <= 1) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setExpanded(!expanded)}
        style={[
          styles.pill,
          {
            backgroundColor: theme.colors.surfaceActive,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.prefix, { color: theme.colors.textMuted }]}>SESSION:</Text>
        <Text style={[styles.activeTitle, { color: theme.colors.primary }]} numberOfLines={1}>
          {activeSession?.name || 'Default Session'}
        </Text>
        <Text style={[styles.chevron, { color: theme.colors.textSecondary }]}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded ? (
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
            {sessions.map((s) => {
              const isCurrent = s.id === activeSession?.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => {
                    setActiveSession(s.id);
                    setExpanded(false);
                  }}
                  style={[
                    styles.dropdownItem,
                    {
                      backgroundColor: isCurrent ? theme.colors.surfaceActive : 'transparent',
                      borderBottomColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.itemText,
                      {
                        color: isCurrent ? theme.colors.primary : theme.colors.textPrimary,
                        fontWeight: isCurrent ? '700' : '500',
                      },
                    ]}
                  >
                    {s.name}
                  </Text>
                  <Text style={[styles.itemCount, { color: theme.colors.textMuted }]}>{s.totalPhotos} photos</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginVertical: 4,
    zIndex: 100,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  prefix: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginRight: 6,
  },
  activeTitle: {
    fontSize: 12,
    fontWeight: '700',
    maxWidth: 200,
  },
  chevron: {
    fontSize: 10,
    marginLeft: 6,
  },
  dropdown: {
    position: 'absolute',
    top: 36,
    left: 16,
    right: 16,
    borderWidth: 1,
    borderRadius: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    maxHeight: 180,
    zIndex: 1000,
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: 180,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemText: {
    fontSize: 13,
  },
  itemCount: {
    fontSize: 11,
  },
});

