import { TestBed } from '@angular/core/testing';
import { provideStore, Store } from '@ngxs/store';
import { SetThemePreference } from './theme.actions';
import {
  COLOR_SCHEME_BY_PREFERENCE,
  DEFAULT_THEME_PREFERENCE,
  THEME_PREFERENCES,
} from './theme.model';
import { ThemeState } from './theme.state';

function setup() {
  TestBed.configureTestingModule({
    providers: [provideStore([ThemeState])],
  });

  return { store: TestBed.inject(Store) };
}

describe('ThemeState', () => {
  it('should default to the default preference', () => {
    const { store } = setup();

    expect(store.selectSnapshot(ThemeState.preference)).toBe(
      DEFAULT_THEME_PREFERENCE,
    );
    expect(store.selectSnapshot(ThemeState.colorScheme)).toBe(
      COLOR_SCHEME_BY_PREFERENCE[DEFAULT_THEME_PREFERENCE],
    );
  });

  it.each(THEME_PREFERENCES)(
    'should expose the %s preference and its color scheme once set',
    (preference) => {
      const { store } = setup();

      store.dispatch(new SetThemePreference(preference));

      expect(store.selectSnapshot(ThemeState.preference)).toBe(preference);
      expect(store.selectSnapshot(ThemeState.colorScheme)).toBe(
        COLOR_SCHEME_BY_PREFERENCE[preference],
      );
    },
  );
});
