import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Store } from '@ngxs/store';
import { mockUser } from '@scheduler/ui/data/testing';
import { SetCurrentUser } from '@scheduler/ui/state';
import { provideTestState } from '@scheduler/ui/test-utils';
import { CurrentUserTileComponent } from './current-user-tile.component';
import { CurrentUserTileHarness } from './current-user-tile.harness';

async function setup() {
  await TestBed.configureTestingModule({
    imports: [CurrentUserTileComponent],
    providers: [provideTestState()],
  }).compileComponents();

  const fixture = TestBed.createComponent(CurrentUserTileComponent);
  const harness = await TestbedHarnessEnvironment.harnessForFixture(
    fixture,
    CurrentUserTileHarness,
  );

  return { fixture, harness, store: TestBed.inject(Store) };
}

describe('CurrentUserTileComponent', () => {
  it('displays the display name of the current user', async () => {
    const { harness, store } = await setup();
    const user = mockUser.MEMBER;

    store.dispatch(new SetCurrentUser(user));

    expect(await harness.getDisplayName()).toBe(user.displayName);
  });

  it('displays nothing when there is no current user', async () => {
    const { harness } = await setup();

    expect(await harness.getDisplayName()).toBeNull();
  });

  it('updates when the current user changes', async () => {
    const { harness, store } = await setup();
    store.dispatch(new SetCurrentUser(mockUser.MEMBER));
    const next = mockUser.COORDINATOR;

    store.dispatch(new SetCurrentUser(next));

    expect(await harness.getDisplayName()).toBe(next.displayName);
  });
});
