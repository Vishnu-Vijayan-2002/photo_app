/**
 * AeroShutter App Navigator
 * Bottom Tab Navigation Bar with reactive badges and seamless screen switching.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useApp } from '../context/AppContext';
import { useUpload } from '../context/UploadContext';
import { LiveShootScreen } from '../screens/LiveShootScreen';
import { GalleryScreen } from '../screens/GalleryScreen';
import { SessionsScreen } from '../screens/SessionsScreen';
import { CloudSyncScreen } from '../screens/CloudSyncScreen';
import { DiagnosticsScreen } from '../screens/DiagnosticsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { PhotoEditorScreen } from '../screens/PhotoEditorScreen';

type TabName = 'Tether' | 'Gallery' | 'Studio' | 'Sessions' | 'Cloud' | 'Settings';

interface TabItem {
  name: TabName;
  label: string;
  icon: string;
}

const TABS: TabItem[] = [
  { name: 'Tether', label: 'Tether', icon: '📷' },
  { name: 'Gallery', label: 'Gallery', icon: '🖼️' },
  { name: 'Studio', label: 'Presets', icon: '🎨' },
  { name: 'Sessions', label: 'Sessions', icon: '📁' },
  { name: 'Cloud', label: 'Cloud Sync', icon: '☁️' },
  { name: 'Settings', label: 'Settings', icon: '⚙️' },
];

export const AppNavigator: React.FC = () => {
  const { theme } = useApp();
  const { queueState } = useUpload();
  const [activeTab, setActiveTab] = useState<TabName>('Tether');

  const renderScreen = () => {
    switch (activeTab) {
      case 'Tether':
        return <LiveShootScreen />;
      case 'Gallery':
        return <GalleryScreen />;
      case 'Studio':
        return <PhotoEditorScreen />;
      case 'Sessions':
        return <SessionsScreen />;
      case 'Cloud':
        return <CloudSyncScreen />;
      case 'Settings':
        return <SettingsScreen />;
      default:
        return <LiveShootScreen />;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.screenContainer}>{renderScreen()}</View>

      <View style={[styles.tabBar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.name;
          const showBadge = tab.name === 'Cloud' && queueState.totalPendingCount > 0;

          return (
            <TouchableOpacity
              key={tab.name}
              activeOpacity={0.8}
              onPress={() => setActiveTab(tab.name)}
              style={styles.tabItem}
            >
              <View style={styles.iconContainer}>
                <Text style={styles.tabIcon}>{tab.icon}</Text>
                {showBadge ? (
                  <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.badgeText}>
                      {queueState.totalPendingCount > 99 ? '99+' : queueState.totalPendingCount}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? theme.colors.primary : theme.colors.textSecondary,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 64 : 58,
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 12 : 4,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconContainer: {
    position: 'relative',
  },
  tabIcon: {
    fontSize: 18,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#000000',
    fontSize: 8,
    fontWeight: '800',
  },
});
