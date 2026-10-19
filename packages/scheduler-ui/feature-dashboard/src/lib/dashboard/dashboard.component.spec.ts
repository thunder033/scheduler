import { Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Store } from '@ngxs/store';
import { ContactMethod, User, UserRole } from '@org/models';
import { SetCurrentUser } from '@org/scheduler-ui/state';
import { provideTestState } from '../../test-utils/provide-test-state';
import { DashboardComponent } from './dashboard.component';
import { DashboardHarness } from './dashboard.harness';

function createUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    displayName: 'Test User',
    contact: [{ method: ContactMethod.Phone, value: '555-0100' }],
    roles: [UserRole.Member],
    ...overrides,
  };
}

interface SetupOptions {
  providers?: Provider[];
}

async function setup({ providers = [] }: SetupOptions = {}) {
  await TestBed.configureTestingModule({
    imports: [DashboardComponent],
    providers: [provideTestState(), ...providers],
  }).compileComponents();

  const fixture = TestBed.createComponent(DashboardComponent);
  const harness = await TestbedHarnessEnvironment.harnessForFixture(
    fixture,
    DashboardHarness,
  );

  return { fixture, harness, store: TestBed.inject(Store) };
}

describe('DashboardComponent', () => {
  it('should render content', async () => {
    const { harness } = await setup();

    expect(await harness.getText()).not.toBe('');
  });

  it('should render the header', async () => {
    const { harness } = await setup();

    await expect(harness.header()).resolves.toBeDefined();
  });

  describe('timeslot planner', () => {
    it('should render for a coordinator', async () => {
      const { harness, store } = await setup();

      store.dispatch(
        new SetCurrentUser(createUser({ roles: [UserRole.Coordinator] })),
      );

      expect(await harness.hasTimeslotPlanner()).toBe(true);
    });

    it.each([UserRole.Member, UserRole.Prospect])(
      'should not render for a %s',
      async (role) => {
        const { harness, store } = await setup();

        store.dispatch(new SetCurrentUser(createUser({ roles: [role] })));

        expect(await harness.hasTimeslotPlanner()).toBe(false);
      },
    );

    it('should not render when there is no current user', async () => {
      const { harness } = await setup();

      expect(await harness.hasTimeslotPlanner()).toBe(false);
    });

    it('should stop rendering when the user is no longer a coordinator', async () => {
      const { harness, store } = await setup();
      store.dispatch(
        new SetCurrentUser(createUser({ roles: [UserRole.Coordinator] })),
      );

      store.dispatch(
        new SetCurrentUser(createUser({ roles: [UserRole.Member] })),
      );

      expect(await harness.hasTimeslotPlanner()).toBe(false);
    });
  });
});
