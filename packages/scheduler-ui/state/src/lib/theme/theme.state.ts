import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { SetThemePreference } from './theme.actions';
import {
  COLOR_SCHEME_BY_PREFERENCE,
  DEFAULT_THEME_PREFERENCE,
  THEME_STATE_NAME,
  ThemePreference,
  ThemeStateModel,
} from './theme.model';

@State<ThemeStateModel>({
  name: THEME_STATE_NAME,
  defaults: { preference: DEFAULT_THEME_PREFERENCE },
})
@Injectable()
export class ThemeState {
  @Selector()
  static preference(state: ThemeStateModel): ThemePreference {
    return state.preference;
  }

  @Selector()
  static colorScheme(state: ThemeStateModel): string {
    return COLOR_SCHEME_BY_PREFERENCE[state.preference];
  }

  @Action(SetThemePreference)
  setPreference(
    context: StateContext<ThemeStateModel>,
    { preference }: SetThemePreference,
  ): void {
    context.patchState({ preference });
  }
}
