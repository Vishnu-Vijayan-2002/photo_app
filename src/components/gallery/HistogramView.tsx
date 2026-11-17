import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useApp } from '../../context/AppContext';

export const HistogramView: React.FC = () => {
  const { theme } = useApp();

  // Simulated luminance histogram curve heights (24 bins)
  const bins = [
    5, 12, 18, 25, 42, 68, 85, 92, 110, 135, 150, 160, 145, 130, 115, 90, 75, 60, 48, 35, 22, 15, 8, 4,
  ];
  const maxVal = Math.max(...bins);

  return (
    <View style={[styles.container, { backgroundColor: '#090B0E', borderColor: theme.colors.border }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.header, { color: theme.colors.textMuted }]}>LUMINANCE HISTOGRAM</Text>
        <Text style={[styles.channel, { color: theme.colors.primary }]}>RGB</Text>
      </View>
      <View style={styles.barsContainer}>
        {bins.map((val, idx) => {
          const heightPercent = Math.round((val / maxVal) * 100);
          return (
            <View key={idx} style={styles.barColumn}>
              <View
                style={[
                  styles.bar,
                  {
                    height: `${heightPercent}%`,
                    backgroundColor: idx > 18 ? '#FF5252' : idx < 5 ? '#448AFF' : '#E0E0E0',
                    opacity: 0.85,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    marginVertical: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  header: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  channel: {
    fontSize: 9,
    fontWeight: '700',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 48,
    width: '100%',
    paddingTop: 4,
  },
  barColumn: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    paddingHorizontal: 0.5,
  },
  bar: {
    width: '100%',
    borderRadius: 1,
  },
});

