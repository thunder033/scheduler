import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Store } from '@ngxs/store';
import {
  SEED_APPOINTMENTS,
  SEED_CURRENT_USER,
  SEED_TIMESLOTS,
  SEED_USERS,
} from '@scheduler/ui/data';
import { SetSideNavCollapsed } from './local-user/local-user.actions';
import { LocalUserState } from './local-user/local-user.state';
import { provideSchedulerUiState } from './provide-scheduler-ui-state';

function createStore(): Store {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideSchedulerUiState(),
      { provide: SEED_USERS, useValue: [] },
      { provide: SEED_TIMESLOTS, useValue: [] },
      { provide: SEED_APPOINTMENTS, useValue: [] },
      { provide: SEED_CURRENT_USER, useValue: null },
    ],
  });

  return TestBed.inject(Store);
}

function setup() {
  localStorage.clear();

  return { store: createStore() };
}

describe('provideSchedulerUiState', () => {
  it('makes the NGXS store available for injection', () => {
    const { store } = setup();

    expect(store.snapshot()).toBeDefined();
  });

  it('remembers whether the side nav is collapsed in a later session', () => {
    const { store } = setup();
    store.dispatch(new SetSideNavCollapsed(true));

    TestBed.resetTestingModule();
    const laterStore = createStore();

    expect(laterStore.selectSnapshot(LocalUserState.sideNavCollapsed)).toBe(
      true,
    );
  });
});
