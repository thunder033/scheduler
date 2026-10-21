import { TestBed } from '@angular/core/testing';
import { provideStore, Store } from '@ngxs/store';
import { UserRole } from '@org/models';
import { mockUser } from '@org/scheduler-ui/data/testing';
import {
  SetCurrentUser,
  SetSideNavCollapsed,
  SetThemePreference,
} from './local-user.actions';
import {
  THEME_COLOR_SCHEME_BY_PREFERENCE,
  DEFAULT_SIDE_NAV_COLLAPSED,
  DEFAULT_THEME_PREFERENCE,
  THEME_PREFERENCES,
} from './local-user.model';
import { LocalUserState } from './local-user.state';

function setup() {
  TestBed.configureTestingModule({
    providers: [provideStore([LocalUserState])],
  });

  return { store: TestBed.inject(Store) };
}

describe('LocalUserState', () => {
  describe('theme', () => {
    it('should default to the default preference', () => {
      const { store } = setup();

      expect(store.selectSnapshot(LocalUserState.themePreference)).toBe(
        DEFAULT_THEME_PREFERENCE,
      );
      expect(store.selectSnapshot(LocalUserState.themeColorScheme)).toBe(
        THEME_COLOR_SCHEME_BY_PREFERENCE[DEFAULT_THEME_PREFERENCE],
      );
    });

    it.each(THEME_PREFERENCES)(
      'should expose the %s preference and its color scheme once set',
      (preference) => {
        const { store } = setup();

        store.dispatch(new SetThemePreference(preference));

        expect(store.selectSnapshot(LocalUserState.themePreference)).toBe(
          preference,
        );
        expect(store.selectSnapshot(LocalUserState.themeColorScheme)).toBe(
          THEME_COLOR_SCHEME_BY_PREFERENCE[preference],
        );
      },
    );
  });

  describe('side nav', () => {
    it('should default to the default collapsed state', () => {
      const { store } = setup();

      expect(store.selectSnapshot(LocalUserState.sideNavCollapsed)).toBe(
        DEFAULT_SIDE_NAV_COLLAPSED,
      );
    });

    it.each([true, false])(
      'should expose the collapsed state once set to %s',
      (collapsed) => {
        const { store } = setup();
        store.dispatch(new SetSideNavCollapsed(!collapsed));

        store.dispatch(new SetSideNavCollapsed(collapsed));

        expect(store.selectSnapshot(LocalUserState.sideNavCollapsed)).toBe(
          collapsed,
        );
      },
    );

    it('should not affect the theme preference', () => {
      const { store } = setup();
      store.dispatch(new SetThemePreference('dark'));

      store.dispatch(new SetSideNavCollapsed(true));

      expect(store.selectSnapshot(LocalUserState.themePreference)).toBe('dark');
    });
  });

  describe('currentUser', () => {
    it('should have no current user by default', () => {
      const { store } = setup();

      expect(store.selectSnapshot(LocalUserState.currentUser)).toBeNull();
    });

    it('should expose the current user once set', () => {
      const { store } = setup();
      const user = mockUser.MEMBER;

      store.dispatch(new SetCurrentUser(user));

      expect(store.selectSnapshot(LocalUserState.currentUser)).toEqual(user);
    });

    it('should clear the current user when set to null', () => {
      const { store } = setup();
      store.dispatch(new SetCurrentUser(mockUser.MEMBER));

      store.dispatch(new SetCurrentUser(null));

      expect(store.selectSnapshot(LocalUserState.currentUser)).toBeNull();
    });

    describe('hasRole', () => {
      it.each(Object.values(UserRole))(
        'should be false for the %s role when there is no current user',
        (role) => {
          const { store } = setup();

          expect(store.selectSnapshot(LocalUserState.hasRole(role))).toBe(
            false,
          );
        },
      );

      it('should be true for every role the current user has', () => {
        const { store } = setup();
        const roles = [UserRole.Coordinator, UserRole.Member];
        store.dispatch(new SetCurrentUser(mockUser({ roles })));

        for (const role of roles) {
          expect(store.selectSnapshot(LocalUserState.hasRole(role))).toBe(true);
        }
      });

      it('should be false for roles the current user does not have', () => {
        const { store } = setup();
        store.dispatch(new SetCurrentUser(mockUser.MEMBER));

        expect(
          store.selectSnapshot(LocalUserState.hasRole(UserRole.Coordinator)),
        ).toBe(false);
      });

      it('should be false again once the current user is cleared', () => {
        const { store } = setup();
        store.dispatch(new SetCurrentUser(mockUser.MEMBER));

        store.dispatch(new SetCurrentUser(null));

        expect(
          store.selectSnapshot(LocalUserState.hasRole(UserRole.Member)),
        ).toBe(false);
      });
    });

    it('should not affect the theme preference', () => {
      const { store } = setup();
      store.dispatch(new SetThemePreference('dark'));

      store.dispatch(new SetCurrentUser(mockUser.MEMBER));

      expect(store.selectSnapshot(LocalUserState.themePreference)).toBe('dark');
    });
  });
});
