import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useApp } from '../../context/AppContext';

interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: string;
  height?: number;
  trackColor?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, color, height = 4, trackColor }) => {
  const { theme } = useApp();
  const clamped = Math.max(0, Math.min(100, progress));

  return (
    <View
      style={[
        styles.container,
        {
          height,
          backgroundColor: trackColor || theme.colors.surfaceActive,
          borderRadius: height / 2,
        },
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${clamped}%`,
            backgroundColor: color || theme.colors.primary,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
