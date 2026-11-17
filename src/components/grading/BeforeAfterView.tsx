import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useApp } from '../../context/AppContext';
import { ColorGradingAdjustments } from '../../types/preset';

interface BeforeAfterViewProps {
  imageUri: string;
  adjustments: ColorGradingAdjustments;
  presetName?: string;
}

export const BeforeAfterView: React.FC<BeforeAfterViewProps> = ({
  imageUri,
  adjustments,
  presetName,
}) => {
  const { theme } = useApp();
  const [isComparingOriginal, setIsComparingOriginal] = useState(false);

  // Compute visual overlay tint based on adjustments
  const isGraded =
    !isComparingOriginal &&
    Object.values(adjustments).some((val) => val !== 0);

  // Color wash calculation
  const getOverlayTint = () => {
    if (!isGraded) return 'transparent';

    // Warm vs Cool tint
    if (adjustments.temperature > 10) {
      const alpha = Math.min(0.25, (adjustments.temperature / 100) * 0.25);
      return `rgba(255, 170, 0, ${alpha})`;
    } else if (adjustments.temperature < -10) {
      const alpha = Math.min(0.25, (Math.abs(adjustments.temperature) / 100) * 0.25);
      return `rgba(0, 150, 255, ${alpha})`;
    }

    if (adjustments.saturation === -100) {
      return 'rgba(0, 0, 0, 0.4)';
    }

    return 'transparent';
  };

  const getVignetteBorder = () => {
    if (!isGraded || adjustments.vignette <= 0) return 0;
    return Math.round((adjustments.vignette / 100) * 20);
  };

  return (
    <View style={[styles.container, { backgroundColor: '#090B0E' }]}>
      <View style={styles.imageWrapper}>
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />

        {/* Live Color Grade simulation overlay */}
        {isGraded ? (
          <View
            style={[
              styles.colorGradeOverlay,
              {
                backgroundColor: getOverlayTint(),
                borderWidth: getVignetteBorder(),
                borderColor: 'rgba(0, 0, 0, 0.65)',
              },
            ]}
          />
        ) : null}

        {/* Status Badge */}
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>
            {isComparingOriginal ? 'ORIGINAL (RAW)' : presetName || 'GRADED'}
          </Text>
        </View>

        {/* Hold to Compare Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPressIn={() => setIsComparingOriginal(true)}
          onPressOut={() => setIsComparingOriginal(false)}
          style={[styles.compareBtn, { backgroundColor: 'rgba(0,0,0,0.75)' }]}
        >
          <Text style={styles.compareBtnText}>👆 Hold to Compare</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  colorGradeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statusBadgeText: {
    color: '#00D1FF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  compareBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  compareBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});

