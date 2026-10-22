import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Store } from '@ngxs/store';
import { mockUser } from '@scheduler/ui/data/testing';
import { provideSchedulerUiState, LocalUserState } from '@scheduler/ui/state';
import { provideTestSeeds } from '@scheduler/ui/test-utils';
import { provideCurrentUserInitializer } from './current-user.initializer';

const CURRENT_USER = mockUser.COORDINATOR;

async function setup() {
  localStorage.clear();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideSchedulerUiState(),
      provideTestSeeds({ currentUser: CURRENT_USER }),
      provideCurrentUserInitializer(),
    ],
  });

  await TestBed.inject(ApplicationInitStatus).donePromise;

  return { store: TestBed.inject(Store) };
}

describe('provideCurrentUserInitializer', () => {
  it('sets the seeded current user during app initialization', async () => {
    const { store } = await setup();

    expect(store.selectSnapshot(LocalUserState.currentUser)).toEqual(
      CURRENT_USER,
    );
  });
});
