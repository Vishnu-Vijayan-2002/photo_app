import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface GoogleAvatarProps {
  photoUrl?: string;
  displayName?: string;
  size?: number;
}

export const GoogleAvatar: React.FC<GoogleAvatarProps> = ({
  photoUrl,
  displayName = 'Google User',
  size = 44,
}) => {
  const [hasError, setHasError] = useState(false);
  const initial = (displayName.charAt(0) || 'G').toUpperCase();

  // Normalize protocol-relative URLs
  const normalizedUrl = photoUrl
    ? photoUrl.startsWith('//')
      ? 'https:' + photoUrl
      : photoUrl
    : undefined;

  const badgeSize = Math.max(14, Math.round(size * 0.36));

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      {normalizedUrl && !hasError ? (
        <Image
          source={{ uri: normalizedUrl }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
          resizeMode="cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.initial, { fontSize: Math.round(size * 0.44) }]}>{initial}</Text>
        </View>
      )}

      {/* Google 'G' Logo Verified Badge in bottom corner */}
      <View
        style={[
          styles.badge,
          {
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
            right: -2,
            bottom: -2,
          },
        ]}
      >
        <Text style={[styles.badgeText, { fontSize: Math.max(8, Math.round(badgeSize * 0.65)) }]}>G</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginRight: 12,
  },
  image: {
    backgroundColor: '#1E232B',
  },
  fallback: {
    backgroundColor: '#1A73E8', // Google Blue
    justifyContent: 'center',
    alignItems: 'center',
  },
  initial: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  badge: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#1A73E8',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 1,
  },
  badgeText: {
    fontWeight: '900',
    color: '#4285F4', // Google brand blue
  },
});

