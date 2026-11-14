/**
 * AeroShutter Settings Screen
 * Preferences for cloud sync, network restrictions, camera protocols, and theme.
 */

import React from 'react';
import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import { useApp } from '../context/AppContext';
import { Header } from '../components/common/Header';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { uploadQueueManager } from '../services/queue/UploadQueueManager';
import { googleAuthService } from '../services/cloud/GoogleAuthService';

export const SettingsScreen: React.FC = () => {
  const { theme, isDark, toggleTheme, settings, updateSettings } = useApp();

  const handleWifiToggle = (val: boolean) => {
    updateSettings({ uploadOnlyOnWifi: val });
    uploadQueueManager.setWifiOnly(val);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title="Settings"
        subtitle="App Preferences & Configuration"
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Appearance */}
        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>APPEARANCE</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>OLED Dark Theme</Text>
              <Text style={[styles.settingDesc, { color: theme.colors.textSecondary }]}>
                Optimized high-contrast dark palette for outdoor shoots and battery preservation
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: theme.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>

        {/* Cloud Upload Policy */}
        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>CLOUD UPLOAD & PRESET POLICIES</Text>

          <View style={[styles.settingRow, { borderBottomColor: theme.colors.border, borderBottomWidth: 1 }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>Transfer Workflow Policy</Text>
              <Text style={[styles.settingDesc, { color: theme.colors.textSecondary }]}>
                Choose default behavior: RAW Direct, Apply Preset & Transfer, or Dual Upload (Both)
              </Text>
            </View>
          </View>

          <View style={[styles.settingRow, { borderBottomColor: theme.colors.border, borderBottomWidth: 1 }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>Auto-Apply Default Preset</Text>
              <Text style={[styles.settingDesc, { color: theme.colors.textSecondary }]}>
                Pre-load Kodak Portra 400 or Cinematic Warm onto incoming tethered camera shots
              </Text>
            </View>
          </View>

          <View style={[styles.settingRow, { borderBottomColor: theme.colors.border, borderBottomWidth: 1 }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>Upload on Wi-Fi Only</Text>
              <Text style={[styles.settingDesc, { color: theme.colors.textSecondary }]}>
                Pause uploads when connected via mobile cellular data to prevent plan overages
              </Text>
            </View>
            <Switch
              value={settings.uploadOnlyOnWifi}
              onValueChange={handleWifiToggle}
              trackColor={{ false: '#767577', true: theme.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.settingRow, { borderBottomColor: theme.colors.border, borderBottomWidth: 1 }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>Upload RAW Files</Text>
              <Text style={[styles.settingDesc, { color: theme.colors.textSecondary }]}>
                Include full-resolution RAW files (.ARW, .CR3, .NEF, .RAF) in automatic cloud sync
              </Text>
            </View>
            <Switch
              value={settings.uploadRawFiles}
              onValueChange={(val) => updateSettings({ uploadRawFiles: val })}
              trackColor={{ false: '#767577', true: theme.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>Drive Root Folder</Text>
              <Text style={[styles.settingDesc, { color: theme.colors.textSecondary }]}>
                Current destination: /{settings.googleDriveRootFolder}
              </Text>
            </View>
          </View>
        </Card>

        {/* Embedded FTP Daemon */}
        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>CAMERA TETHERING PROTOCOL</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>Auto-Start FTP Daemon</Text>
              <Text style={[styles.settingDesc, { color: theme.colors.textSecondary }]}>
                Automatically launch internal FTP server when app starts on port {settings.ftpServerPort}
              </Text>
            </View>
            <Switch
              value={settings.autoStartFtpServer}
              onValueChange={(val) => updateSettings({ autoStartFtpServer: val })}
              trackColor={{ false: '#767577', true: theme.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>

        {/* Account & Legal */}
        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>ACCOUNT & LEGAL</Text>
          <View style={styles.accountActionRow}>
            <Text style={[styles.accountStatus, { color: theme.colors.textSecondary }]}>
              Logged in as {googleAuthService.getCurrentAccount()?.email}
            </Text>
            <Button
              title="Sign Out"
              size="sm"
              variant="outline"
              onPress={() => googleAuthService.signOut()}
            />
          </View>

          <View style={[styles.legalBox, { backgroundColor: theme.colors.surfaceActive }]}>
            <Text style={[styles.legalTitle, { color: theme.colors.textPrimary }]}>AeroShutter v1.0.0</Text>
            <Text style={[styles.legalText, { color: theme.colors.textMuted }]}>
              Built with React Native, TypeScript, Android Kotlin & iOS Swift. Clean-room independent
              implementation engineered for professional photographers.
            </Text>
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
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 3,
  },
  accountActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  accountStatus: {
    fontSize: 12,
  },
  legalBox: {
    padding: 12,
    borderRadius: 8,
  },
  legalTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  legalText: {
    fontSize: 11,
    lineHeight: 15,
  },
});
