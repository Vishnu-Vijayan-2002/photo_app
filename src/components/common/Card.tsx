import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useApp } from '../../context/AppContext';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'surface' | 'elevated' | 'bordered';
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'surface' }) => {
  const { theme } = useApp();

  const getBackgroundColor = () => {
    switch (variant) {
      case 'elevated':
        return theme.colors.elevated;
      case 'bordered':
      case 'surface':
      default:
        return theme.colors.surface;
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: theme.colors.border,
          borderWidth: 1,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
  },
});
