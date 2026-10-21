import { InjectionToken } from '@angular/core';
import { Appointment, Timeslot, User } from '@org/models';

// The entities the stubbed services start with; there are no defaults, so whoever provides the
// services decides which entities exist

export const SEED_USERS = new InjectionToken<User[]>('SEED_USERS');

export const SEED_TIMESLOTS = new InjectionToken<Timeslot[]>('SEED_TIMESLOTS');

export const SEED_APPOINTMENTS = new InjectionToken<Appointment[]>(
  'SEED_APPOINTMENTS',
);

export const SEED_CURRENT_USER = new InjectionToken<User | null>(
  'SEED_CURRENT_USER',
);
