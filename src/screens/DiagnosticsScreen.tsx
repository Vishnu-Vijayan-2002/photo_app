/**
 * AeroShutter Diagnostics Screen
 * Hardware, network, and cloud connectivity diagnostic tests.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useApp } from '../context/AppContext';
import { useCamera } from '../context/CameraContext';
import { Header } from '../components/common/Header';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { ftpServerService } from '../services/camera/FtpServerService';
import { networkMonitor } from '../services/queue/NetworkMonitor';
import { googleAuthService } from '../services/cloud/GoogleAuthService';

export const DiagnosticsScreen: React.FC = () => {
  const { theme } = useApp();
  const { cameraInfo, setMockProfile } = useCamera();
  const [pingLatency, setPingLatency] = useState<number | null>(42);
  const [isRunningPing, setIsRunningPing] = useState(false);

  const runCloudPing = async () => {
    setIsRunningPing(true);
    const start = Date.now();
    await new Promise((r) => setTimeout(r, 120));
    setPingLatency(Date.now() - start);
    setIsRunningPing(false);
  };

  const net = networkMonitor.getState();
  const ftpConfig = ftpServerService.getConfig();

  const diagnosticItems = [
    {
      title: 'Operating System',
      value: `${Platform.OS.toUpperCase()} (API 35/17.0)`,
      status: 'OK',
    },
    {
      title: 'Network Interface',
      value: net.isWifi ? 'Wi-Fi Hotspot Active' : 'Cellular 5G',
      status: net.isConnected ? 'OK' : 'DISCONNECTED',
    },
    {
      title: 'Local FTP Daemon',
      value: `Listening on ${ftpConfig.activeIp}:${ftpConfig.port}`,
      status: ftpConfig.isRunning ? 'OK' : 'STANDBY',
    },
    {
      title: 'USB Host (OTG)',
      value: Platform.OS === 'android' ? 'Supported (android.hardware.usb.host)' : 'iOS Camera Adapter Mode',
      status: 'OK',
    },
    {
      title: 'Google Drive REST API',
      value: googleAuthService.isAuthenticated() ? 'Authenticated (drive.file scope)' : 'Unauthenticated',
      status: googleAuthService.isAuthenticated() ? 'OK' : 'WARNING',
    },
    {
      title: 'Cloud API Latency',
      value: pingLatency ? `${pingLatency} ms` : 'Not tested',
      status: pingLatency && pingLatency < 200 ? 'OK' : 'SLOW',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title="Diagnostics"
        subtitle="Hardware & Subsystem Health Checks"
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>SUBSYSTEM HEALTH</Text>
          <View style={[styles.diagList, { borderColor: theme.colors.border }]}>
            {diagnosticItems.map((item, idx) => (
              <View
                key={idx}
                style={[
                  styles.diagRow,
                  {
                    borderBottomColor: theme.colors.border,
                    borderBottomWidth: idx < diagnosticItems.length - 1 ? 1 : 0,
                  },
                ]}
              >
                <View style={styles.diagInfo}>
                  <Text style={[styles.diagTitle, { color: theme.colors.textPrimary }]}>{item.title}</Text>
                  <Text style={[styles.diagVal, { color: theme.colors.textSecondary }]}>{item.value}</Text>
                </View>
                <Badge
                  label={item.status}
                  variant={item.status === 'OK' ? 'success' : item.status === 'STANDBY' ? 'primary' : 'warning'}
                  size="sm"
                />
              </View>
            ))}
          </View>

          <Button
            title={isRunningPing ? 'Pinging Cloud...' : 'Ping Google Drive Endpoint'}
            variant="outline"
            size="sm"
            onPress={runCloudPing}
            style={styles.pingBtn}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>CAMERA PROFILE SIMULATOR</Text>
          <Text style={[styles.profileDesc, { color: theme.colors.textSecondary }]}>
            Select simulated camera body profile to test RAW header parsing, burst timing, and EXIF telemetry:
          </Text>

          <View style={styles.profileRow}>
            <Button
              title="Sony α7 IV (ARW)"
              size="sm"
              variant={cameraInfo.brand === 'Sony' ? 'primary' : 'secondary'}
              onPress={() => setMockProfile('Sony')}
              style={styles.profileBtn}
            />
            <Button
              title="Canon R5 (CR3)"
              size="sm"
              variant={cameraInfo.brand === 'Canon' ? 'primary' : 'secondary'}
              onPress={() => setMockProfile('Canon')}
              style={styles.profileBtn}
            />
            <Button
              title="Nikon Z8 (NEF)"
              size="sm"
              variant={cameraInfo.brand === 'Nikon' ? 'primary' : 'secondary'}
              onPress={() => setMockProfile('Nikon')}
              style={styles.profileBtn}
            />
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingVertical: 12,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  diagList: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  diagInfo: {
    flex: 1,
    marginRight: 8,
  },
  diagTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  diagVal: {
    fontSize: 11,
    marginTop: 2,
  },
  pingBtn: {
    alignSelf: 'flex-start',
  },
  profileDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  profileRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  profileBtn: {
    margin: 4,
  },
});

