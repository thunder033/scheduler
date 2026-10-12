import { ThemePreference } from './theme.model';

export class SetThemePreference {
  static readonly type = '[Theme] Set Preference';

  constructor(readonly preference: ThemePreference) {}
}
