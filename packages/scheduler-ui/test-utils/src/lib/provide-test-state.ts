import { EnvironmentProviders, Provider } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Appointment, Timeslot, User } from '@org/models';
import {
  SEED_APPOINTMENTS,
  SEED_CURRENT_USER,
  SEED_TIMESLOTS,
  SEED_USERS,
} from '@org/scheduler-ui/data';
import { provideSchedulerUiState } from '@org/scheduler-ui/state';

/** The entities the stubbed services start with; a test only seeds what it expects to find */
export interface TestSeeds {
  users?: User[];
  timeslots?: Timeslot[];
  appointments?: Appointment[];
  currentUser?: User | null;
}

export function provideTestState(
  seeds: TestSeeds = {},
): (Provider | EnvironmentProviders)[] {
  localStorage.clear();
  return [
    provideRouter([]),
    provideSchedulerUiState(),
    provideTestSeeds(seeds),
  ];
}

export function provideTestSeeds({
  users = [],
  timeslots = [],
  appointments = [],
  currentUser = null,
}: TestSeeds = {}): Provider[] {
  return [
    { provide: SEED_USERS, useValue: users },
    { provide: SEED_TIMESLOTS, useValue: timeslots },
    { provide: SEED_APPOINTMENTS, useValue: appointments },
    { provide: SEED_CURRENT_USER, useValue: currentUser },
  ];
}
