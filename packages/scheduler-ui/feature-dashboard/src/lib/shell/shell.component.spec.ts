import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Store } from '@ngxs/store';
import { User, UserRole } from '@org/models';
import { SetCurrentUser } from '@org/scheduler-ui/state';
import { provideTestState } from '../../test-utils/provide-test-state';
import { AppointmentsHarness } from '../appointments/appointments.harness';
import { DashboardHarness } from '../dashboard/dashboard.harness';
import { featureDashboardRoutes } from '../feature-dashboard.routes';
import {
  APPOINTMENTS_PATH,
  TIMESLOTS_PATH,
  WELCOME_PATH,
} from '../feature-dashboard.paths';
import { NAV_ITEMS } from '../side-nav/side-nav.component';
import { TimeslotPlannerHarness } from '../timeslot-planner/timeslot-planner.harness';
import { ShellHarness } from './shell.harness';

function labelOf(path: string): string {
  const item = NAV_ITEMS.find((navItem) => navItem.path === path);
  assert(item, `No navigation item for ${path}`);
  return item.label;
}

async function setup(roles: UserRole[] = [UserRole.Member]) {
  await TestBed.configureTestingModule({
    providers: [provideTestState(), provideRouter(featureDashboardRoutes)],
  }).compileComponents();

  const user: User = {
    id: 'user-1',
    displayName: 'Test User',
    contact: [],
    roles,
  };
  TestBed.inject(Store).dispatch(new SetCurrentUser(user));

  const routerHarness = await RouterTestingHarness.create();
  const loader = TestbedHarnessEnvironment.loader(routerHarness.fixture);

  return {
    routerHarness,
    loader,
    shell: () => loader.getHarness(ShellHarness),
    navigate: async (url: string) => {
      await routerHarness.navigateByUrl(url);
    },
  };
}

describe('ShellComponent', () => {
  it('should show the dashboard beside the navigation by default', async () => {
    const { loader, navigate, shell } = await setup();

    await navigate(`/${WELCOME_PATH}`);

    await expect(shell()).resolves.toBeDefined();
    await expect(loader.getHarness(DashboardHarness)).resolves.toBeDefined();
  });

  it('should show the appointments when the user navigates to them', async () => {
    const { loader, navigate, shell } = await setup();
    await navigate(`/${WELCOME_PATH}`);

    await (
      await (await shell()).sideNav()
    ).navigateTo(labelOf(APPOINTMENTS_PATH));

    await expect(loader.getHarness(AppointmentsHarness)).resolves.toBeDefined();
  });

  describe('timeslot planner', () => {
    it('should show when a coordinator navigates to it', async () => {
      const { loader, navigate, shell } = await setup([UserRole.Coordinator]);
      await navigate(`/${WELCOME_PATH}`);

      await (
        await (await shell()).sideNav()
      ).navigateTo(labelOf(TIMESLOTS_PATH));

      await expect(
        loader.getHarness(TimeslotPlannerHarness),
      ).resolves.toBeDefined();
    });

    it('should not be reachable for a member, who is sent to the dashboard', async () => {
      const { loader, navigate } = await setup([UserRole.Member]);

      await navigate(`/${TIMESLOTS_PATH}`);

      expect(await loader.hasHarness(TimeslotPlannerHarness)).toBe(false);
    });
  });
});
