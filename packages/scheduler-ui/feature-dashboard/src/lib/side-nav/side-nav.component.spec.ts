import { BreakpointObserver } from '@angular/cdk/layout';
import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Store } from '@ngxs/store';
import { of } from 'rxjs';
import { UserRole } from '@org/models';
import { mockUser } from '@org/scheduler-ui/data/testing';
import {
  LocalUserState,
  SetCurrentUser,
  SetSideNavCollapsed,
} from '@org/scheduler-ui/state';
import { provideTestState } from '@org/scheduler-ui/test-utils';
import { THEME_OPTIONS } from '../theme-menu/theme-menu.component';
import {
  NAV_ITEMS,
  SIDE_NAV_TITLE,
  SideNavComponent,
} from './side-nav.component';
import { SideNavHarness } from './side-nav.harness';

interface SetupOptions {
  /** Whether the screen is wide; jsdom has no media queries, so it is narrow unless set */
  desktop?: boolean;
  /** The collapsed state the user left the side nav in earlier */
  collapsed?: boolean;
}

async function setup({ desktop = false, collapsed }: SetupOptions = {}) {
  await TestBed.configureTestingModule({
    imports: [SideNavComponent],
    providers: [
      provideTestState(),
      {
        provide: BreakpointObserver,
        useValue: { observe: () => of({ matches: desktop, breakpoints: {} }) },
      },
    ],
  }).compileComponents();

  const store = TestBed.inject(Store);
  if (collapsed !== undefined) {
    store.dispatch(new SetSideNavCollapsed(collapsed));
  }

  const fixture = TestBed.createComponent(SideNavComponent);
  const harness = await TestbedHarnessEnvironment.harnessForFixture(
    fixture,
    SideNavHarness,
  );

  return { fixture, harness, store };
}

describe('SideNavComponent', () => {
  it('displays the application title', async () => {
    const { harness } = await setup();

    expect(await harness.getTitle()).toBe(SIDE_NAV_TITLE);
  });

  it('displays the current user', async () => {
    const { harness, store } = await setup();
    const user = mockUser.MEMBER;

    store.dispatch(new SetCurrentUser(user));

    const currentUserTile = await harness.currentUserTile();
    expect(await currentUserTile.getDisplayName()).toBe(user.displayName);
  });

  it('lets the user choose a theme', async () => {
    const { harness } = await setup();
    const themeMenu = await harness.themeMenu();
    const { label } = THEME_OPTIONS[0];

    await themeMenu.selectTheme(label);

    expect(await themeMenu.getSelectedTheme()).toBe(label);
  });

  describe('navigation items', () => {
    it('lists the items for everyone, but not the role-specific ones, to a member', async () => {
      const { harness, store } = await setup();

      store.dispatch(new SetCurrentUser(mockUser.MEMBER));

      expect(await harness.getNavigationLabels()).toEqual(
        NAV_ITEMS.filter((item) => !item.role).map((item) => item.label),
      );
    });

    it('also lists the role-specific items to a user with that role', async () => {
      const { harness, store } = await setup();

      store.dispatch(new SetCurrentUser(mockUser.COORDINATOR));

      expect(await harness.getNavigationLabels()).toEqual(
        NAV_ITEMS.map((item) => item.label),
      );
    });
  });

  describe('on a wide screen', () => {
    it('starts open and expanded', async () => {
      const { harness } = await setup({ desktop: true });

      expect(await harness.isOpen()).toBe(true);
      expect(await harness.isCollapsed()).toBe(false);
    });

    it('collapses to the icons and expands again with the collapse toggle', async () => {
      const { harness } = await setup({ desktop: true });

      await harness.toggleCollapsed();
      expect(await harness.isCollapsed()).toBe(true);

      await harness.toggleCollapsed();
      expect(await harness.isCollapsed()).toBe(false);
    });

    it('starts collapsed when the user left it collapsed', async () => {
      const { harness } = await setup({ desktop: true, collapsed: true });

      expect(await harness.isCollapsed()).toBe(true);
    });

    it('remembers the collapsed state in the local state', async () => {
      const { harness, store } = await setup({ desktop: true });

      await harness.toggleCollapsed();

      expect(store.selectSnapshot(LocalUserState.sideNavCollapsed)).toBe(true);
    });

    it('keeps the navigation and theme menu available while collapsed', async () => {
      const { harness } = await setup({ desktop: true });
      const labels = await harness.getNavigationLabels();

      await harness.toggleCollapsed();

      expect(await harness.getNavigationLabels()).toEqual(labels);
      await expect(harness.themeMenu()).resolves.toBeDefined();
    });
  });

  describe('on a narrow screen', () => {
    it('does not collapse when the user left it collapsed on a wide screen', async () => {
      const { harness } = await setup({ collapsed: true });

      expect(await harness.isCollapsed()).toBe(false);
    });

    it('does not offer collapsing, since it folds out instead', async () => {
      const { harness } = await setup();

      expect(await harness.hasCollapseToggle()).toBe(false);
    });

    it('starts collapsed', async () => {
      const { harness } = await setup();

      expect(await harness.isOpen()).toBe(false);
    });

    it('folds out and collapses again with the navigation toggle', async () => {
      const { harness } = await setup();

      await harness.togglePanel();
      expect(await harness.isOpen()).toBe(true);

      await harness.togglePanel();
      expect(await harness.isOpen()).toBe(false);
    });
  });
});
