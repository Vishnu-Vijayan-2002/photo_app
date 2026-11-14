/**
 * AeroShutter Color System
 * Tailored for high-end photography apps with OLED dark theme and clear visual hierarchy.
 */

export const darkPalette = {
  // Backgrounds
  background: '#0D0F12',
  surface: '#15191F',
  surfaceHover: '#1E232B',
  surfaceActive: '#262D38',
  elevated: '#1A1F27',
  card: '#161B22',
  overlay: 'rgba(0, 0, 0, 0.75)',

  // Borders
  border: '#252C37',
  borderHighlight: '#3B4554',

  // Primary Accent (Aero Cyan / Electric Blue)
  primary: '#00D1FF',
  primaryMuted: 'rgba(0, 209, 255, 0.15)',
  primaryHover: '#33DAFF',

  // Secondary Accent (Shutter Gold)
  secondary: '#FFB800',
  secondaryMuted: 'rgba(255, 184, 0, 0.15)',

  // Status Colors
  success: '#00E676',
  successMuted: 'rgba(0, 230, 118, 0.15)',
  warning: '#FF9100',
  warningMuted: 'rgba(255, 145, 0, 0.15)',
  error: '#FF3D71',
  errorMuted: 'rgba(255, 61, 113, 0.15)',
  info: '#2979FF',
  infoMuted: 'rgba(41, 121, 255, 0.15)',

  // Text Colors
  textPrimary: '#FFFFFF',
  textSecondary: '#9AA4B2',
  textMuted: '#626D7D',
  textInverse: '#0D0F12',

  // Media badges
  rawBadge: '#9C27B0',
  jpegBadge: '#009688',
  cameraBrandSony: '#E53935',
  cameraBrandCanon: '#D32F2F',
  cameraBrandNikon: '#FFEB3B',
  cameraBrandFuji: '#4CAF50',
};

export const lightPalette = {
  // Backgrounds
  background: '#F4F6F8',
  surface: '#FFFFFF',
  surfaceHover: '#E9ECEF',
  surfaceActive: '#DEE2E6',
  elevated: '#FFFFFF',
  card: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Borders
  border: '#E1E4E8',
  borderHighlight: '#CBD0D6',

  // Primary Accent
  primary: '#0088CC',
  primaryMuted: 'rgba(0, 136, 204, 0.12)',
  primaryHover: '#0077B3',

  // Secondary Accent
  secondary: '#E68A00',
  secondaryMuted: 'rgba(230, 138, 0, 0.12)',

  // Status Colors
  success: '#00A854',
  successMuted: 'rgba(0, 168, 84, 0.12)',
  warning: '#D46B08',
  warningMuted: 'rgba(212, 107, 8, 0.12)',
  error: '#CF1322',
  errorMuted: 'rgba(207, 19, 34, 0.12)',
  info: '#1890FF',
  infoMuted: 'rgba(24, 144, 255, 0.12)',

  // Text Colors
  textPrimary: '#1F2429',
  textSecondary: '#4A5568',
  textMuted: '#8C9BAE',
  textInverse: '#FFFFFF',

  // Media badges
  rawBadge: '#7B1FA2',
  jpegBadge: '#00796B',
  cameraBrandSony: '#C62828',
  cameraBrandCanon: '#B71C1C',
  cameraBrandNikon: '#F57F17',
  cameraBrandFuji: '#388E3C',
};

export type ThemeColors = typeof darkPalette;
