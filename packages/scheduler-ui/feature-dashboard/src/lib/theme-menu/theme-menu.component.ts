import { Component, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import {
  SetThemePreference,
  THEME_PREFERENCES,
  ThemePreference,
  LocalUserState,
} from '@org/scheduler-ui/state';
import { Store } from '@ngxs/store';

export const THEME_MENU_LABEL = 'Theme';

export const THEME_LABELS: Record<ThemePreference, string> = {
  light: 'Light',
  dark: 'Dark',
  auto: 'Auto',
};

export const THEME_OPTIONS = THEME_PREFERENCES.map((value) => ({
  value,
  label: THEME_LABELS[value],
}));

@Component({
  selector: 'lib-theme-menu',
  imports: [MatIconButton, MatIcon, MatMenu, MatMenuItem, MatMenuTrigger],
  templateUrl: './theme-menu.component.html',
  styleUrl: './theme-menu.component.scss',
})
export class ThemeMenuComponent {
  private readonly store = inject(Store);

  protected readonly label = THEME_MENU_LABEL;
  protected readonly options = THEME_OPTIONS;
  protected readonly preference = this.store.selectSignal(
    LocalUserState.themePreference,
  );

  protected select(preference: ThemePreference): void {
    this.store.dispatch(new SetThemePreference(preference));
  }
}
