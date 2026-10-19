import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Store } from '@ngxs/store';
import { ContactMethod, User, UserRole } from '@org/models';
import { SetCurrentUser } from '@org/scheduler-ui/state';
import { provideTestState } from '@org/scheduler-ui/test-utils';
import { DashboardComponent, WELCOME_MESSAGE } from './dashboard.component';
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

async function setup() {
  await TestBed.configureTestingModule({
    imports: [DashboardComponent],
    providers: [provideTestState()],
  }).compileComponents();

  const fixture = TestBed.createComponent(DashboardComponent);
  const harness = await TestbedHarnessEnvironment.harnessForFixture(
    fixture,
    DashboardHarness,
  );

  return { fixture, harness, store: TestBed.inject(Store) };
}

describe('DashboardComponent', () => {
  it('should welcome the user by name', async () => {
    const { harness, store } = await setup();
    const user = createUser();

    store.dispatch(new SetCurrentUser(user));

    const message = await harness.getWelcomeMessage();
    expect(message).toContain(WELCOME_MESSAGE);
    expect(message).toContain(user.displayName);
  });

  it('should welcome the user when there is no current user', async () => {
    const { harness } = await setup();

    expect(await harness.getWelcomeMessage()).toContain(WELCOME_MESSAGE);
  });
});
