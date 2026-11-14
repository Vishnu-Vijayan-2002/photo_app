import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useApp } from '../../context/AppContext';
import { useCamera } from '../../context/CameraContext';
import { Badge } from '../common/Badge';

export const CameraStatusHUD: React.FC = () => {
  const { theme } = useApp();
  const { cameraInfo, connect, disconnect, isAutoCapturing, toggleAutoCapture } = useCamera();

  const isConnected = cameraInfo.status === 'CONNECTED' || cameraInfo.status === 'LISTENING';

  const getStatusBadge = () => {
    switch (cameraInfo.status) {
      case 'CONNECTED':
        return <Badge label="Connected" variant="success" />;
      case 'LISTENING':
        return <Badge label="Listening" variant="primary" />;
      case 'CONNECTING':
        return <Badge label="Connecting..." variant="warning" />;
      case 'ERROR':
        return <Badge label="Error" variant="error" />;
      case 'DISCONNECTED':
      default:
        return <Badge label="Offline" variant="secondary" />;
    }
  };

  const getBrandBadge = () => {
    const brandColors: Record<string, string> = {
      Sony: '#E53935',
      Canon: '#D32F2F',
      Nikon: '#FFB800',
      Fujifilm: '#00E676',
      Generic: theme.colors.primary,
    };
    return (
      <View
        style={[
          styles.brandBadge,
          { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: brandColors[cameraInfo.brand] || theme.colors.border },
        ]}
      >
        <Text style={[styles.brandText, { color: brandColors[cameraInfo.brand] || theme.colors.textPrimary }]}>
          {cameraInfo.brand.toUpperCase()}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={styles.topRow}>
        <View style={styles.camNameRow}>
          {getBrandBadge()}
          <View style={styles.nameContainer}>
            <Text style={[styles.cameraName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
              {cameraInfo.name}
            </Text>
            <Text style={[styles.cameraModel, { color: theme.colors.textSecondary }]}>
              {cameraInfo.mode.replace('_', ' ')} • {cameraInfo.firmwareVersion || 'Direct'}
            </Text>
          </View>
        </View>
        <View style={styles.statusCol}>{getStatusBadge()}</View>
      </View>

      <View style={[styles.bottomRow, { borderTopColor: theme.colors.border }]}>
        <View style={styles.telemetryGroup}>
          {cameraInfo.batteryLevel !== undefined ? (
            <View style={styles.telemetryItem}>
              <Text style={[styles.telemetryLabel, { color: theme.colors.textMuted }]}>BATTERY</Text>
              <Text style={[styles.telemetryValue, { color: theme.colors.success }]}>{cameraInfo.batteryLevel}%</Text>
            </View>
          ) : null}

          {cameraInfo.port ? (
            <View style={styles.telemetryItem}>
              <Text style={[styles.telemetryLabel, { color: theme.colors.textMuted }]}>PORT</Text>
              <Text style={[styles.telemetryValue, { color: theme.colors.primary }]}>{cameraInfo.port}</Text>
            </View>
          ) : null}

          {cameraInfo.mode === 'MOCK_SIMULATOR' ? (
            <TouchableOpacity
              onPress={toggleAutoCapture}
              style={[
                styles.burstToggle,
                {
                  backgroundColor: isAutoCapturing ? theme.colors.warningMuted : theme.colors.surfaceActive,
                  borderColor: isAutoCapturing ? theme.colors.warning : theme.colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.burstDot,
                  { backgroundColor: isAutoCapturing ? theme.colors.warning : theme.colors.textMuted },
                ]}
              />
              <Text
                style={[
                  styles.burstText,
                  { color: isAutoCapturing ? theme.colors.warning : theme.colors.textSecondary },
                ]}
              >
                {isAutoCapturing ? 'Bursting (3s)' : 'Sim Burst'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={isConnected ? disconnect : connect}
          style={[
            styles.actionButton,
            {
              backgroundColor: isConnected ? theme.colors.surfaceActive : theme.colors.primary,
              borderColor: isConnected ? theme.colors.border : theme.colors.primary,
            },
          ]}
        >
          <Text
            style={[
              styles.actionButtonText,
              { color: isConnected ? theme.colors.textPrimary : theme.colors.textInverse },
            ]}
          >
            {isConnected ? 'Disconnect' : 'Connect'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  camNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  brandBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 10,
  },
  brandText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  nameContainer: {
    flex: 1,
  },
  cameraName: {
    fontSize: 15,
    fontWeight: '700',
  },
  cameraModel: {
    fontSize: 11,
    marginTop: 2,
  },
  statusCol: {
    marginLeft: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  telemetryGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  telemetryItem: {
    marginRight: 16,
  },
  telemetryLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  telemetryValue: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 1,
  },
  burstToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  burstDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  burstText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
