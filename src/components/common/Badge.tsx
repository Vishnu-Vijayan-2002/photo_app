import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useApp } from '../../context/AppContext';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'raw' | 'jpeg';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'primary', size = 'sm' }) => {
  const { theme } = useApp();

  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: theme.colors.successMuted, text: theme.colors.success };
      case 'warning':
        return { bg: theme.colors.warningMuted, text: theme.colors.warning };
      case 'error':
        return { bg: theme.colors.errorMuted, text: theme.colors.error };
      case 'raw':
        return { bg: 'rgba(187, 134, 252, 0.2)', text: '#BB86FC' };
      case 'jpeg':
        return { bg: 'rgba(0, 209, 255, 0.2)', text: '#00D1FF' };
      case 'secondary':
        return { bg: theme.colors.surfaceActive, text: theme.colors.textSecondary };
      case 'primary':
      default:
        return { bg: theme.colors.primaryMuted, text: theme.colors.primary };
    }
  };

  const { bg, text } = getColors();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          paddingVertical: size === 'sm' ? 4 : 6,
          paddingHorizontal: size === 'sm' ? 10 : 14,
          borderRadius: 4,
          minWidth: size === 'sm' ? 62 : 78,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: text,
            fontSize: size === 'sm' ? 10 : 12,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
});

