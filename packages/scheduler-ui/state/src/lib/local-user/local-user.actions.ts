import { User } from '@org/models';
import { ThemePreference } from './local-user.model';

export class SetThemePreference {
  static readonly type = '[Local User] Set Theme Preference';

  constructor(readonly preference: ThemePreference) {}
}

export class SetCurrentUser {
  static readonly type = '[Local User] Set Current User';

  constructor(readonly user: User | null) {}
}
