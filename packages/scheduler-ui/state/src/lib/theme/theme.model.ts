export const THEME_STATE_NAME = 'theme';

export const THEME_PREFERENCES = ['light', 'dark', 'auto'] as const;

export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'auto';

export const COLOR_SCHEME_BY_PREFERENCE: Record<ThemePreference, string> = {
  light: 'light',
  dark: 'dark',
  auto: 'light dark',
};

export interface ThemeStateModel {
  preference: ThemePreference;
}
