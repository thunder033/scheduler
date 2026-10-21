import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Store } from '@ngxs/store';
import { UserRole } from '@org/models';
import { mockUser } from '@org/scheduler-ui/data/testing';
import { SetCurrentUser } from '@org/scheduler-ui/state';
import { provideTestState } from '@org/scheduler-ui/test-utils';
import { DashboardHarness } from '../dashboard/dashboard.harness';
import {
  APPOINTMENTS_PATH,
  TIMESLOTS_PATH,
  WELCOME_PATH,
} from '../feature-dashboard.paths';
import { featureDashboardRoutes } from '../feature-dashboard.routes';
import { NAV_ITEMS } from '../side-nav/side-nav.component';
import { ShellHarness } from './shell.harness';

const ROOT_URL = '/';

function labelOf(path: string): string {
  const item = NAV_ITEMS.find((navItem) => navItem.path === path);
  assert(item, `No navigation item for ${path}`);
  return item.label;
}

async function setup(roles: UserRole[] = [UserRole.Member]) {
  await TestBed.configureTestingModule({
    providers: [provideTestState(), provideRouter(featureDashboardRoutes)],
  }).compileComponents();

  TestBed.inject(Store).dispatch(new SetCurrentUser(mockUser({ roles })));

  const routerHarness = await RouterTestingHarness.create();
  const loader = TestbedHarnessEnvironment.loader(routerHarness.fixture);
  const router = TestBed.inject(Router);

  return {
    loader,
    router,
    shell: () => loader.getHarness(ShellHarness),
    navigate: async (url: string) => {
      await routerHarness.navigateByUrl(url);
    },
    /** Lazy-loaded views take a moment to load */
    settled: () => routerHarness.fixture.whenStable(),
  };
}

describe('ShellComponent', () => {
  it('should show the dashboard beside the navigation by default', async () => {
    const { loader, navigate, shell } = await setup();

    await navigate(`/${WELCOME_PATH}`);

    await expect(shell()).resolves.toBeDefined();
    await expect(loader.getHarness(DashboardHarness)).resolves.toBeDefined();
  });

  it('should take the user to the appointments from the navigation', async () => {
    const { navigate, router, settled, shell } = await setup();
    await navigate(`/${WELCOME_PATH}`);

    await (
      await (await shell()).sideNav()
    ).navigateTo(labelOf(APPOINTMENTS_PATH));
    await settled();

    expect(router.url).toBe(`/${APPOINTMENTS_PATH}`);
  });

  describe('timeslots', () => {
    it('should take a coordinator there from the navigation', async () => {
      const { navigate, router, settled, shell } = await setup([
        UserRole.Coordinator,
      ]);
      await navigate(`/${WELCOME_PATH}`);

      await (
        await (await shell()).sideNav()
      ).navigateTo(labelOf(TIMESLOTS_PATH));
      await settled();

      expect(router.url).toBe(`/${TIMESLOTS_PATH}`);
    });

    it('should send a member to the dashboard instead', async () => {
      const { navigate, router } = await setup([UserRole.Member]);

      await navigate(`/${TIMESLOTS_PATH}`);

      expect(router.url).toBe(ROOT_URL);
    });
  });
});
