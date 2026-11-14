import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useApp } from '../../context/AppContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, rightAction }) => {
  const { theme } = useApp();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      {rightAction ? <View style={styles.actionContainer}>{rightAction}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  actionContainer: {
    marginLeft: 12,
  },
});
