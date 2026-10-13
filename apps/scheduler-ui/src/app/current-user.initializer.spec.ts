import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Store } from '@ngxs/store';
import { AuthService } from '@org/scheduler-ui/data';
import {
  provideSchedulerUiState,
  LocalUserState,
} from '@org/scheduler-ui/state';
import { firstValueFrom } from 'rxjs';
import { provideCurrentUserInitializer } from './current-user.initializer';

async function setup() {
  localStorage.clear();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideSchedulerUiState(),
      provideCurrentUserInitializer(),
    ],
  });

  await TestBed.inject(ApplicationInitStatus).donePromise;

  return { store: TestBed.inject(Store) };
}

describe('provideCurrentUserInitializer', () => {
  it('should set the current user from the auth service during app initialization', async () => {
    const { store } = await setup();
    const expectedUser = await firstValueFrom(
      TestBed.inject(AuthService).getCurrentUser(),
    );

    expect(store.selectSnapshot(LocalUserState.currentUser)).toEqual(
      expectedUser,
    );
  });
});
