import { User } from '@org/models';

export const LOCAL_USER_STATE_NAME = 'localUser';

export const THEME_PREFERENCES = ['light', 'dark', 'auto'] as const;

export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'auto';

export const DEFAULT_SIDE_NAV_COLLAPSED = false;

export const THEME_COLOR_SCHEME_BY_PREFERENCE: Record<ThemePreference, string> =
  {
    light: 'light',
    dark: 'dark',
    auto: 'light dark',
  };

export interface LocalUserStateModel {
  currentUser: User | null;
  themePreference: ThemePreference;
  /** Whether the user folded the side navigation down to its icons */
  sideNavCollapsed: boolean;
}
