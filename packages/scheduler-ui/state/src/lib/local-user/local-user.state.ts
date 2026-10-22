import { Injectable } from '@angular/core';
import {
  Action,
  createSelector,
  Selector,
  State,
  StateContext,
} from '@ngxs/store';
import { User, UserRole } from '@scheduler/models';
import {
  SetCurrentUser,
  SetSideNavCollapsed,
  SetThemePreference,
} from './local-user.actions';
import {
  THEME_COLOR_SCHEME_BY_PREFERENCE,
  DEFAULT_SIDE_NAV_COLLAPSED,
  DEFAULT_THEME_PREFERENCE,
  LOCAL_USER_STATE_NAME,
  ThemePreference,
  LocalUserStateModel,
} from './local-user.model';

@State<LocalUserStateModel>({
  name: LOCAL_USER_STATE_NAME,
  defaults: {
    currentUser: null,
    themePreference: DEFAULT_THEME_PREFERENCE,
    sideNavCollapsed: DEFAULT_SIDE_NAV_COLLAPSED,
  },
})
@Injectable()
export class LocalUserState {
  @Selector()
  static currentUser(state: LocalUserStateModel): User | null {
    return state.currentUser;
  }

  static hasRole(role: UserRole) {
    return createSelector(
      [LocalUserState],
      (state: LocalUserStateModel): boolean =>
        state.currentUser?.roles.includes(role) ?? false,
    );
  }

  @Selector()
  static themePreference(state: LocalUserStateModel): ThemePreference {
    return state.themePreference;
  }

  @Selector()
  static sideNavCollapsed(state: LocalUserStateModel): boolean {
    return state.sideNavCollapsed;
  }

  @Selector()
  static themeColorScheme(state: LocalUserStateModel): string {
    return THEME_COLOR_SCHEME_BY_PREFERENCE[state.themePreference];
  }

  @Action(SetThemePreference)
  setThemePreference(
    context: StateContext<LocalUserStateModel>,
    { preference }: SetThemePreference,
  ): void {
    context.patchState({ themePreference: preference });
  }

  @Action(SetSideNavCollapsed)
  setSideNavCollapsed(
    context: StateContext<LocalUserStateModel>,
    { collapsed }: SetSideNavCollapsed,
  ): void {
    context.patchState({ sideNavCollapsed: collapsed });
  }

  @Action(SetCurrentUser)
  setCurrentUser(
    context: StateContext<LocalUserStateModel>,
    { user }: SetCurrentUser,
  ): void {
    context.patchState({ currentUser: user });
  }
}
