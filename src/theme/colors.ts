/**
 * AeroShutter Color System
 * Tailored for high-end photography apps with OLED dark theme and clear visual hierarchy.
 */

export const darkPalette = {
  // Backgrounds - Studio Deep Obsidian & Precision Matte
  background: '#090A0C',
  surface: '#111317',
  surfaceHover: '#181A20',
  surfaceActive: '#1F222A',
  elevated: '#15171C',
  card: '#131519',
  overlay: 'rgba(0, 0, 0, 0.80)',

  // Borders - Precision hairline dividers
  border: '#21252D',
  borderHighlight: '#323742',

  // Primary Accent (TetherFlow Electric Cyan)
  primary: '#00D2FF',
  primaryMuted: 'rgba(0, 210, 255, 0.12)',
  primaryHover: '#29DAFF',

  // Secondary Accent (TetherFlow Warm Amber)
  secondary: '#FF8A00',
  secondaryMuted: 'rgba(255, 138, 0, 0.12)',

  // Status Colors
  success: '#10B981',
  successMuted: 'rgba(16, 185, 129, 0.12)',
  warning: '#F59E0B',
  warningMuted: 'rgba(245, 158, 11, 0.12)',
  error: '#EF4444',
  errorMuted: 'rgba(239, 68, 68, 0.12)',
  info: '#3B82F6',
  infoMuted: 'rgba(59, 130, 246, 0.12)',

  // Text Colors
  textPrimary: '#F4F4F6',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  textInverse: '#090A0C',

  // Media badges
  rawBadge: '#A855F7',
  jpegBadge: '#06B6D4',
  cameraBrandSony: '#E11D48',
  cameraBrandCanon: '#DC2626',
  cameraBrandNikon: '#EAB308',
  cameraBrandFuji: '#10B981',
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

