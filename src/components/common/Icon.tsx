import React from 'react';
import { View, StyleSheet } from 'react-native';

export type IconName =
  | 'camera'
  | 'gallery'
  | 'presets'
  | 'sessions'
  | 'cloud'
  | 'settings'
  | 'bolt'
  | 'select'
  | 'palette'
  | 'wifi'
  | 'usb'
  | 'refresh'
  | 'check';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export const Icon: React.FC<IconProps> = ({ name, size = 20, color = '#FFFFFF' }) => {
  const scale = size / 24;

  switch (name) {
    case 'camera':
      return (
        <View style={[styles.center, { width: size, height: size }]}>
          <View
            style={{
              width: 8 * scale,
              height: 2.5 * scale,
              backgroundColor: color,
              borderTopLeftRadius: 1.5 * scale,
              borderTopRightRadius: 1.5 * scale,
              marginBottom: -0.5 * scale,
            }}
          />
          <View
            style={{
              width: 21 * scale,
              height: 14 * scale,
              borderWidth: 1.8 * scale,
              borderColor: color,
              borderRadius: 3.5 * scale,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 7 * scale,
                height: 7 * scale,
                borderRadius: 3.5 * scale,
                borderWidth: 1.6 * scale,
                borderColor: color,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: 2 * scale,
                right: 2.5 * scale,
                width: 2 * scale,
                height: 2 * scale,
                borderRadius: 1 * scale,
                backgroundColor: color,
              }}
            />
          </View>
        </View>
      );

    case 'gallery':
      const cellSize = 7 * scale;
      const gap = 2.5 * scale;
      return (
        <View style={[styles.center, { width: size, height: size }]}>
          <View style={{ flexDirection: 'row', marginBottom: gap }}>
            <View style={{ width: cellSize, height: cellSize, borderRadius: 2 * scale, borderWidth: 1.8 * scale, borderColor: color }} />
            <View style={{ width: gap }} />
            <View style={{ width: cellSize, height: cellSize, borderRadius: 2 * scale, borderWidth: 1.8 * scale, borderColor: color }} />
          </View>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ width: cellSize, height: cellSize, borderRadius: 2 * scale, borderWidth: 1.8 * scale, borderColor: color }} />
            <View style={{ width: gap }} />
            <View style={{ width: cellSize, height: cellSize, borderRadius: 2 * scale, borderWidth: 1.8 * scale, borderColor: color }} />
          </View>
        </View>
      );

    case 'presets':
      return (
        <View style={[styles.center, { width: size, height: size }]}>
          <View style={{ width: 18 * scale, height: 4 * scale, justifyContent: 'center', marginVertical: 1 * scale }}>
            <View style={{ height: 1.8 * scale, backgroundColor: color, borderRadius: 1 }} />
            <View style={{ position: 'absolute', left: 3 * scale, width: 4.5 * scale, height: 4.5 * scale, borderRadius: 2.5 * scale, backgroundColor: color }} />
          </View>
          <View style={{ width: 18 * scale, height: 4 * scale, justifyContent: 'center', marginVertical: 1 * scale }}>
            <View style={{ height: 1.8 * scale, backgroundColor: color, borderRadius: 1 }} />
            <View style={{ position: 'absolute', right: 3 * scale, width: 4.5 * scale, height: 4.5 * scale, borderRadius: 2.5 * scale, backgroundColor: color }} />
          </View>
          <View style={{ width: 18 * scale, height: 4 * scale, justifyContent: 'center', marginVertical: 1 * scale }}>
            <View style={{ height: 1.8 * scale, backgroundColor: color, borderRadius: 1 }} />
            <View style={{ position: 'absolute', left: 9 * scale, width: 4.5 * scale, height: 4.5 * scale, borderRadius: 2.5 * scale, backgroundColor: color }} />
          </View>
        </View>
      );

    case 'sessions':
      return (
        <View style={[styles.center, { width: size, height: size }]}>
          <View
            style={{
              width: 8 * scale,
              height: 3 * scale,
              borderTopWidth: 1.8 * scale,
              borderLeftWidth: 1.8 * scale,
              borderRightWidth: 1.8 * scale,
              borderColor: color,
              borderTopLeftRadius: 2 * scale,
              borderTopRightRadius: 2 * scale,
              alignSelf: 'flex-start',
              marginLeft: 2 * scale,
              marginBottom: -1 * scale,
            }}
          />
          <View
            style={{
              width: 20 * scale,
              height: 13 * scale,
              borderWidth: 1.8 * scale,
              borderColor: color,
              borderRadius: 2.5 * scale,
            }}
          />
        </View>
      );

    case 'cloud':
      return (
        <View style={[styles.center, { width: size, height: size }]}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: -2.5 * scale }}>
            <View style={{ width: 7 * scale, height: 7 * scale, borderRadius: 3.5 * scale, borderWidth: 1.8 * scale, borderColor: color, borderBottomWidth: 0, marginRight: -2 * scale }} />
            <View style={{ width: 10 * scale, height: 10 * scale, borderRadius: 5 * scale, borderWidth: 1.8 * scale, borderColor: color, borderBottomWidth: 0, zIndex: 1 }} />
            <View style={{ width: 6.5 * scale, height: 6.5 * scale, borderRadius: 3.5 * scale, borderWidth: 1.8 * scale, borderColor: color, borderBottomWidth: 0, marginLeft: -2 * scale }} />
          </View>
          <View
            style={{
              width: 19 * scale,
              height: 6 * scale,
              borderWidth: 1.8 * scale,
              borderTopWidth: 0,
              borderColor: color,
              borderBottomLeftRadius: 4 * scale,
              borderBottomRightRadius: 4 * scale,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{ width: 1.6 * scale, height: 3.5 * scale, backgroundColor: color, marginBottom: 1 * scale }} />
          </View>
        </View>
      );

    case 'settings':
      return (
        <View style={[styles.center, { width: size, height: size }]}>
          <View
            style={{
              width: 16 * scale,
              height: 16 * scale,
              borderRadius: 8 * scale,
              borderWidth: 1.8 * scale,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{ width: 5 * scale, height: 5 * scale, borderRadius: 2.5 * scale, backgroundColor: color }} />
          </View>
          <View style={{ position: 'absolute', top: 2 * scale, width: 3 * scale, height: 2.5 * scale, backgroundColor: color, borderRadius: 0.8 * scale }} />
          <View style={{ position: 'absolute', bottom: 2 * scale, width: 3 * scale, height: 2.5 * scale, backgroundColor: color, borderRadius: 0.8 * scale }} />
          <View style={{ position: 'absolute', left: 2 * scale, width: 2.5 * scale, height: 3 * scale, backgroundColor: color, borderRadius: 0.8 * scale }} />
          <View style={{ position: 'absolute', right: 2 * scale, width: 2.5 * scale, height: 3 * scale, backgroundColor: color, borderRadius: 0.8 * scale }} />
        </View>
      );

    case 'bolt':
      return (
        <View style={[styles.center, { width: size, height: size }]}>
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 4 * scale,
              borderRightWidth: 3 * scale,
              borderBottomWidth: 8 * scale,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: color,
              transform: [{ rotate: '15deg' }],
              marginBottom: -2 * scale,
            }}
          />
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 3 * scale,
              borderRightWidth: 4 * scale,
              borderTopWidth: 8 * scale,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderTopColor: color,
              transform: [{ rotate: '15deg' }],
            }}
          />
        </View>
      );

    case 'select':
      return (
        <View style={[styles.center, { width: size, height: size }]}>
          <View
            style={{
              width: 17 * scale,
              height: 17 * scale,
              borderWidth: 1.8 * scale,
              borderColor: color,
              borderRadius: 3.5 * scale,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 7 * scale,
                height: 4 * scale,
                borderLeftWidth: 1.8 * scale,
                borderBottomWidth: 1.8 * scale,
                borderColor: color,
                transform: [{ rotate: '-45deg' }],
                marginTop: -1.5 * scale,
              }}
            />
          </View>
        </View>
      );

    case 'palette':
      return (
        <View style={[styles.center, { width: size, height: size }]}>
          <View
            style={{
              width: 18 * scale,
              height: 18 * scale,
              borderRadius: 9 * scale,
              borderWidth: 1.8 * scale,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{ flexDirection: 'row', marginBottom: 2 * scale }}>
              <View style={{ width: 2.5 * scale, height: 2.5 * scale, borderRadius: 1.5 * scale, backgroundColor: color, marginRight: 2 * scale }} />
              <View style={{ width: 2.5 * scale, height: 2.5 * scale, borderRadius: 1.5 * scale, backgroundColor: color }} />
            </View>
            <View style={{ width: 2.5 * scale, height: 2.5 * scale, borderRadius: 1.5 * scale, backgroundColor: color, alignSelf: 'flex-start', marginLeft: 4 * scale }} />
          </View>
        </View>
      );

    case 'check':
      return (
        <View style={[styles.center, { width: size, height: size }]}>
          <View
            style={{
              width: 10 * scale,
              height: 6 * scale,
              borderLeftWidth: 2 * scale,
              borderBottomWidth: 2 * scale,
              borderColor: color,
              transform: [{ rotate: '-45deg' }],
              marginTop: -2 * scale,
            }}
          />
        </View>
      );

    default:
      return <View style={{ width: size, height: size }} />;
  }
};

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

