import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useApp } from '../../context/AppContext';
import { ftpServerService } from '../../services/camera/FtpServerService';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

export const FtpServerConfigCard: React.FC = () => {
  const { theme } = useApp();
  const config = ftpServerService.getConfig();

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Built-in Camera FTP Server</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Enter these parameters into your camera's FTP Transfer Menu
          </Text>
        </View>
        <Badge label={config.isRunning ? 'RUNNING' : 'STOPPED'} variant={config.isRunning ? 'success' : 'secondary'} />
      </View>

      <View style={[styles.table, { borderColor: theme.colors.border }]}>
        <View style={[styles.row, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Host IP (Hotspot)</Text>
          <Text style={[styles.value, { color: theme.colors.primary }]}>{config.activeIp}</Text>
        </View>
        <View style={[styles.row, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>FTP Port</Text>
          <Text style={[styles.value, { color: theme.colors.textPrimary }]}>{config.port}</Text>
        </View>
        <View style={[styles.row, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Passive Port Range</Text>
          <Text style={[styles.value, { color: theme.colors.textPrimary }]}>
            {config.passivePortRange.min} - {config.passivePortRange.max}
          </Text>
        </View>
        <View style={[styles.row, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>User Account</Text>
          <Text style={[styles.value, { color: theme.colors.textPrimary }]}>
            {config.anonymousAllowed ? 'Anonymous (or aeroshutter)' : config.username}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Target Directory</Text>
          <Text style={[styles.value, { color: theme.colors.textPrimary }]}>/</Text>
        </View>
      </View>

      <View style={[styles.tipBox, { backgroundColor: theme.colors.primaryMuted, borderColor: theme.colors.primary }]}>
        <Text style={[styles.tipText, { color: theme.colors.primary }]}>
          PRO TIP: On Sony cameras, navigate to Network → FTP Transfer Func. → Server Setting 1. On Canon, go to
          Communication Settings → FTP Transfer.
        </Text>
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
    alignItems: 'flex-start',
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
  table: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
  value: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  tipBox: {
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  tipText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
  },
});

