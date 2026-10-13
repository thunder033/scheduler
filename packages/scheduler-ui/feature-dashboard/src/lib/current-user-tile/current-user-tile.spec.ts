import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Store } from '@ngxs/store';
import { ContactMethod, User, UserRole } from '@org/models';
import { SetCurrentUser } from '@org/scheduler-ui/state';
import { provideTestState } from '../../test-utils/provide-test-state';
import { CurrentUserTile } from './current-user-tile';
import { CurrentUserTileHarness } from './current-user-tile.harness';

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
    imports: [CurrentUserTile],
    providers: [provideTestState()],
  }).compileComponents();

  const fixture = TestBed.createComponent(CurrentUserTile);
  const harness = await TestbedHarnessEnvironment.harnessForFixture(
    fixture,
    CurrentUserTileHarness,
  );

  return { fixture, harness, store: TestBed.inject(Store) };
}

describe('CurrentUserTile', () => {
  it('should display the display name of the current user', async () => {
    const { harness, store } = await setup();
    const user = createUser();

    store.dispatch(new SetCurrentUser(user));

    expect(await harness.getDisplayName()).toBe(user.displayName);
  });

  it('should display nothing when there is no current user', async () => {
    const { harness } = await setup();

    expect(await harness.getDisplayName()).toBeNull();
  });

  it('should update when the current user changes', async () => {
    const { harness, store } = await setup();
    store.dispatch(new SetCurrentUser(createUser()));
    const next = createUser({ id: 'user-2', displayName: 'Another User' });

    store.dispatch(new SetCurrentUser(next));

    expect(await harness.getDisplayName()).toBe(next.displayName);
  });
});
