import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useApp } from '../../context/AppContext';
import { ColorGradingAdjustments } from '../../types/preset';

interface ColorGradingSlidersProps {
  adjustments: ColorGradingAdjustments;
  onChangeAdjustment: (key: keyof ColorGradingAdjustments, value: number) => void;
  onResetAll: () => void;
}

type SliderCategory = 'TONE' | 'COLOR' | 'EFFECTS';

export const ColorGradingSliders: React.FC<ColorGradingSlidersProps> = ({
  adjustments,
  onChangeAdjustment,
  onResetAll,
}) => {
  const { theme } = useApp();
  const [activeCategory, setActiveCategory] = useState<SliderCategory>('TONE');

  const stepValue = (key: keyof ColorGradingAdjustments, delta: number, min = -100, max = 100) => {
    const current = adjustments[key];
    const next = Math.max(min, Math.min(max, current + delta));
    onChangeAdjustment(key, next);
  };

  const renderSliderRow = (
    label: string,
    key: keyof ColorGradingAdjustments,
    min = -100,
    max = 100,
    unit = ''
  ) => {
    const value = adjustments[key];
    const isModified = value !== 0;

    return (
      <View style={[styles.sliderRow, { borderBottomColor: theme.colors.border }]}>
        <View style={styles.labelCol}>
          <Text
            style={[
              styles.sliderLabel,
              { color: isModified ? theme.colors.primary : theme.colors.textPrimary },
            ]}
          >
            {label}
          </Text>
          <TouchableOpacity onPress={() => onChangeAdjustment(key, 0)}>
            <Text
              style={[
                styles.sliderValue,
                { color: isModified ? theme.colors.primary : theme.colors.textSecondary },
              ]}
            >
              {value > 0 ? `+${value}` : `${value}`}
              {unit}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tactile control bar */}
        <View style={styles.controlsCol}>
          <TouchableOpacity
            onPress={() => stepValue(key, -10, min, max)}
            style={[styles.stepBtn, { backgroundColor: theme.colors.surfaceActive }]}
          >
            <Text style={[styles.stepBtnText, { color: theme.colors.textPrimary }]}>-10</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => stepValue(key, -2, min, max)}
            style={[styles.stepBtnSmall, { backgroundColor: theme.colors.surfaceActive }]}
          >
            <Text style={[styles.stepBtnText, { color: theme.colors.textSecondary }]}>-</Text>
          </TouchableOpacity>

          {/* Center track indicator */}
          <View style={[styles.trackBar, { backgroundColor: theme.colors.surfaceActive }]}>
            <View
              style={[
                styles.trackFill,
                {
                  width: `${Math.abs(value)}%`,
                  alignSelf: value >= 0 ? 'flex-start' : 'flex-end',
                  backgroundColor: isModified ? theme.colors.primary : 'transparent',
                },
              ]}
            />
          </View>

          <TouchableOpacity
            onPress={() => stepValue(key, 2, min, max)}
            style={[styles.stepBtnSmall, { backgroundColor: theme.colors.surfaceActive }]}
          >
            <Text style={[styles.stepBtnText, { color: theme.colors.textSecondary }]}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => stepValue(key, 10, min, max)}
            style={[styles.stepBtn, { backgroundColor: theme.colors.surfaceActive }]}
          >
            <Text style={[styles.stepBtnText, { color: theme.colors.textPrimary }]}>+10</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Category Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: theme.colors.border }]}>
        <View style={styles.tabGroup}>
          {(['TONE', 'COLOR', 'EFFECTS'] as SliderCategory[]).map((cat) => {
            const isTabActive = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCategory(cat)}
                style={[
                  styles.tabButton,
                  { borderBottomColor: isTabActive ? theme.colors.primary : 'transparent' },
                ]}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    { color: isTabActive ? theme.colors.primary : theme.colors.textSecondary },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity onPress={onResetAll} style={styles.resetBtn}>
          <Text style={[styles.resetBtnText, { color: theme.colors.error }]}>Reset All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.slidersList} showsVerticalScrollIndicator={false}>
        {activeCategory === 'TONE' && (
          <>
            {renderSliderRow('Exposure', 'exposure')}
            {renderSliderRow('Contrast', 'contrast')}
            {renderSliderRow('Highlights', 'highlights')}
            {renderSliderRow('Shadows', 'shadows')}
            {renderSliderRow('Whites', 'whites')}
            {renderSliderRow('Blacks', 'blacks')}
          </>
        )}

        {activeCategory === 'COLOR' && (
          <>
            {renderSliderRow('Temperature (Warm/Cool)', 'temperature')}
            {renderSliderRow('Tint (Green/Magenta)', 'tint')}
            {renderSliderRow('Vibrance', 'vibrance')}
            {renderSliderRow('Saturation', 'saturation')}
          </>
        )}

        {activeCategory === 'EFFECTS' && (
          <>
            {renderSliderRow('Clarity', 'clarity')}
            {renderSliderRow('Vignette', 'vignette', 0, 100)}
            {renderSliderRow('Matte Fade', 'fade', 0, 100)}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  tabGroup: {
    flexDirection: 'row',
  },
  tabButton: {
    paddingVertical: 10,
    marginRight: 16,
    borderBottomWidth: 2,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  resetBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  resetBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  slidersList: {
    paddingHorizontal: 16,
    maxHeight: 220,
  },
  sliderRow: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  labelCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sliderLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  sliderValue: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  controlsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepBtn: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  stepBtnSmall: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  stepBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  trackBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 3,
  },
});
