import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useApp } from '../../context/AppContext';
import { useCamera } from '../../context/CameraContext';
import { usbTetherService } from '../../services/camera/UsbTetherService';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { UsbDeviceInfo } from '../../types/camera';

export const UsbConnectionCard: React.FC = () => {
  const { theme } = useApp();
  const { triggerShutter } = useCamera();
  const [devices, setDevices] = useState<UsbDeviceInfo[]>([]);
  const [scanning, setScanning] = useState(false);

  const scanDevices = async () => {
    setScanning(true);
    const found = await usbTetherService.scanForCameras();
    setDevices(found);
    setScanning(false);
  };

  useEffect(() => {
    scanDevices();
  }, []);

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>USB-OTG Camera Bridge</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Connect camera via USB-C OTG cable (PC Remote / Tether mode)
          </Text>
        </View>
        <Button
          title={scanning ? 'Scanning...' : 'Scan USB'}
          size="sm"
          variant="outline"
          onPress={scanDevices}
        />
      </View>

      {devices.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: theme.colors.surfaceActive }]}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No USB Camera detected on OTG bus.
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.textMuted }]}>
            Connect your camera using a USB-C data cable and ensure USB Connection is set to 'PC Remote' or 'MTP'.
          </Text>
        </View>
      ) : (
        <View style={styles.deviceList}>
          {devices.map((d) => (
            <View key={d.deviceId} style={[styles.deviceItem, { borderColor: theme.colors.border }]}>
              <View>
                <Text style={[styles.deviceName, { color: theme.colors.textPrimary }]}>
                  {d.productName || 'Digital Camera'}
                </Text>
                <Text style={[styles.deviceVendor, { color: theme.colors.textSecondary }]}>
                  Vendor ID: {d.vendorId.toString(16)} | Product ID: {d.productId.toString(16)}
                </Text>
              </View>
              <Button
                title={d.hasPermission ? 'Connected' : 'Grant'}
                size="sm"
                variant={d.hasPermission ? 'secondary' : 'primary'}
                onPress={() => usbTetherService.requestUsbPermission(d.deviceId)}
              />
            </View>
          ))}
        </View>
      )}

      <View style={styles.actionsRow}>
        <Button
          title="Trigger Shutter (Remote)"
          variant="primary"
          onPress={triggerShutter}
          style={styles.shutterBtn}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
    maxWidth: 240,
  },
  emptyBox: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 15,
  },
  deviceList: {
    marginBottom: 12,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  deviceName: {
    fontSize: 13,
    fontWeight: '700',
  },
  deviceVendor: {
    fontSize: 10,
    marginTop: 2,
  },
  actionsRow: {
    marginTop: 4,
  },
  shutterBtn: {
    width: '100%',
  },
});
