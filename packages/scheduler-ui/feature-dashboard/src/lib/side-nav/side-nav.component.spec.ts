import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Store } from '@ngxs/store';
import { User, UserRole } from '@org/models';
import { SetCurrentUser } from '@org/scheduler-ui/state';
import { provideTestState } from '../../test-utils/provide-test-state';
import { THEME_OPTIONS } from '../theme-menu/theme-menu.component';
import {
  NAV_ITEMS,
  SIDE_NAV_TITLE,
  SideNavComponent,
} from './side-nav.component';
import { SideNavHarness } from './side-nav.harness';

async function setup() {
  await TestBed.configureTestingModule({
    imports: [SideNavComponent],
    providers: [provideTestState()],
  }).compileComponents();

  const fixture = TestBed.createComponent(SideNavComponent);
  const harness = await TestbedHarnessEnvironment.harnessForFixture(
    fixture,
    SideNavHarness,
  );

  return { fixture, harness, store: TestBed.inject(Store) };
}

describe('SideNavComponent', () => {
  it('should display the application title', async () => {
    const { harness } = await setup();

    expect(await harness.getTitle()).toBe(SIDE_NAV_TITLE);
  });

  it('should display the current user', async () => {
    const { harness, store } = await setup();
    const user: User = {
      id: 'user-1',
      displayName: 'Test User',
      contact: [],
      roles: [UserRole.Member],
    };

    store.dispatch(new SetCurrentUser(user));

    const currentUserTile = await harness.currentUserTile();
    expect(await currentUserTile.getDisplayName()).toBe(user.displayName);
  });

  it('should let the user choose a theme', async () => {
    const { harness } = await setup();
    const themeMenu = await harness.themeMenu();
    const { label } = THEME_OPTIONS[0];

    await themeMenu.selectTheme(label);

    expect(await themeMenu.getSelectedTheme()).toBe(label);
  });

  describe('navigation items', () => {
    function createUser(roles: UserRole[]): User {
      return { id: 'user-1', displayName: 'Test User', contact: [], roles };
    }

    it('should list the items for everyone, but not the role-specific ones, to a member', async () => {
      const { harness, store } = await setup();

      store.dispatch(new SetCurrentUser(createUser([UserRole.Member])));

      expect(await harness.getNavigationLabels()).toEqual(
        NAV_ITEMS.filter((item) => !item.role).map((item) => item.label),
      );
    });

    it('should also list the role-specific items to a user with that role', async () => {
      const { harness, store } = await setup();

      store.dispatch(new SetCurrentUser(createUser([UserRole.Coordinator])));

      expect(await harness.getNavigationLabels()).toEqual(
        NAV_ITEMS.map((item) => item.label),
      );
    });
  });

  describe('on a narrow screen', () => {
    it('should start collapsed', async () => {
      const { harness } = await setup();

      expect(await harness.isOpen()).toBe(false);
    });

    it('should fold out and collapse again with the navigation toggle', async () => {
      const { harness } = await setup();

      await harness.togglePanel();
      expect(await harness.isOpen()).toBe(true);

      await harness.togglePanel();
      expect(await harness.isOpen()).toBe(false);
    });
  });
});
