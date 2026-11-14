import { darkPalette, lightPalette, ThemeColors } from './colors';
import { typography } from './typography';
import { spacing, borderRadius } from './spacing';

export { darkPalette, lightPalette, typography, spacing, borderRadius };
export type { ThemeColors };

export interface AppTheme {
  isDark: boolean;
  colors: ThemeColors;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
}

export const getTheme = (isDark = true): AppTheme => ({
  isDark,
  colors: isDark ? darkPalette : lightPalette,
  typography,
  spacing,
  borderRadius,
});
