/**
 * AeroShutter Google Account Connection Modal
 * Provides 1-click Google Account connection, token authentication,
 * and live profile & quota verification.
 */

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, Linking } from 'react-native';
import { useApp } from '../../context/AppContext';
import { useUpload } from '../../context/UploadContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { GoogleAvatar } from '../common/GoogleAvatar';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const GoogleAccountModal: React.FC<Props> = ({ visible, onClose }) => {
  const { theme } = useApp();
  const { account, connectAccountWithToken, signOutAccount } = useUpload();
  const [tokenInput, setTokenInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const isDemoAccount = account?.accessToken?.startsWith('ya29.aeroshutter_prod_token_');

  const handleConnectWithToken = async () => {
    if (!tokenInput.trim()) {
      setIsError(true);
      setStatusMessage('Please enter a valid Google OAuth access token');
      return;
    }

    setIsLoading(true);
    setStatusMessage('Verifying token with Google Drive v3 API...');
    setIsError(false);

    try {
      await connectAccountWithToken(tokenInput.trim());
      setIsLoading(false);
      setStatusMessage('Real Google Drive Account verified and linked!');
      setTimeout(() => {
        onClose();
        setStatusMessage(null);
        setTokenInput('');
      }, 1000);
    } catch (err: any) {
      setIsLoading(false);
      setIsError(true);
      setStatusMessage(err?.message || 'Could not verify token with Google');
    }
  };

  const handleOpenOAuthPlayground = () => {
    Linking.openURL(
      'https://developers.google.com/oauthplayground/#step1&apisSelect=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.file'
    ).catch(() => {});
  };

  const handleOpenGoogleDriveWeb = () => {
    Linking.openURL('https://drive.google.com').catch(() => {});
  };

  const handleSignOut = async () => {
    await signOutAccount();
    onClose();
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Google Drive Cloud Account">
      {account ? (
        <View style={styles.connectedContainer}>
          <View style={styles.userRow}>
            <GoogleAvatar
              photoUrl={account.photoUrl}
              displayName={account.displayName}
              size={54}
            />

            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: theme.colors.textPrimary }]}>
                {account.displayName}
              </Text>
              <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
                {account.email}
              </Text>
              <View style={styles.badgeRow}>
                <Badge
                  label={isDemoAccount ? 'OFFLINE DEMO' : 'LIVE GOOGLE DRIVE'}
                  variant={isDemoAccount ? 'warning' : 'success'}
                  size="sm"
                />
                <Badge label="DRIVE.FILE SCOPE" variant="secondary" size="sm" />
              </View>
            </View>
          </View>

          {isDemoAccount ? (
            <View style={[styles.demoNotice, { backgroundColor: theme.colors.surfaceActive, borderColor: theme.colors.warning }]}>
              <Text style={[styles.demoNoticeTitle, { color: theme.colors.warning }]}>
                ⚠️ Currently in Demo Mode
              </Text>
              <Text style={[styles.demoNoticeText, { color: theme.colors.textSecondary }]}>
                You are using the offline simulated profile. Photos upload to the local queue, but will NOT appear on your actual drive.google.com website until you link your real Google account below.
              </Text>
            </View>
          ) : (
            <View style={[styles.securityNotice, { backgroundColor: theme.colors.surfaceActive }]}>
              <Text style={[styles.securityTitle, { color: theme.colors.textPrimary }]}>
                🔒 Real Google Drive Sync Active
              </Text>
              <Text style={[styles.securityText, { color: theme.colors.textSecondary }]}>
                Photos upload to Google Drive under 'TetherFlow / [Session Name]'.
              </Text>
              <TouchableOpacity onPress={handleOpenGoogleDriveWeb} style={styles.openDriveLink}>
                <Text style={[styles.openDriveText, { color: theme.colors.primary }]}>
                  🌐 Open Google Drive (drive.google.com) ↗
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <Button
            title={isDemoAccount ? 'Switch to Real Google Account' : 'Disconnect Google Account'}
            variant={isDemoAccount ? 'primary' : 'danger'}
            size="md"
            onPress={handleSignOut}
            style={styles.signOutBtn}
          />
        </View>
      ) : (
        <View style={styles.connectContainer}>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            To upload photos directly to your personal Google Drive (drive.google.com):
          </Text>

          <Button
            title="🔑 1-Tap: Get My Google Access Token"
            variant="primary"
            size="md"
            onPress={handleOpenOAuthPlayground}
            style={styles.oauthBtn}
          />

          <Text style={[styles.instructionText, { color: theme.colors.textMuted }]}>
            1. Tap above to open Google's Authorize page in your browser.{'\n'}
            2. Log in with your Google account & tap 'Exchange tokens'.{'\n'}
            3. Copy the 'ya29...' access token and paste it below:
          </Text>

          <Text style={[styles.inputLabel, { color: theme.colors.textMuted }]}>
            PASTE GOOGLE ACCESS TOKEN (ya29...)
          </Text>
          <TextInput
            placeholder="Paste ya29... token here"
            placeholderTextColor={theme.colors.textMuted}
            value={tokenInput}
            onChangeText={setTokenInput}
            autoCapitalize="none"
            autoCorrect={false}
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surfaceActive,
                borderColor: theme.colors.border,
                color: theme.colors.textPrimary,
              },
            ]}
          />

          {statusMessage ? (
            <Text style={[styles.statusText, { color: isError ? theme.colors.error : theme.colors.success }]}>
              {statusMessage}
            </Text>
          ) : null}

          <Button
            title="✓ Verify & Connect My Google Drive"
            variant="primary"
            size="md"
            onPress={handleConnectWithToken}
            loading={isLoading}
            style={styles.verifyBtn}
          />
        </View>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  connectedContainer: {
    paddingVertical: 10,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  demoNotice: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  demoNoticeTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  demoNoticeText: {
    fontSize: 11,
    lineHeight: 16,
  },
  securityNotice: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  securityTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  securityText: {
    fontSize: 11,
    lineHeight: 16,
  },
  openDriveLink: {
    marginTop: 8,
    paddingVertical: 4,
  },
  openDriveText: {
    fontSize: 12,
    fontWeight: '700',
  },
  signOutBtn: {
    marginTop: 8,
  },
  connectContainer: {
    paddingVertical: 8,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  oauthBtn: {
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 11,
    lineHeight: 17,
    marginBottom: 14,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginHorizontal: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 12,
    marginBottom: 10,
    fontWeight: '500',
  },
  verifyBtn: {
    marginTop: 4,
  },
});
