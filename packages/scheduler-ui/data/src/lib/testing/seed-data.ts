import { Provider } from '@angular/core';
import { Appointment, Timeslot, User } from '@scheduler/models';
import { addWeeks, getISOWeek, getISOWeekYear } from 'date-fns';
import { mockAppointment } from './mock-appointment';
import { mockTimeslot } from './mock-timeslot';
import { mockUser } from './mock-user';
import {
  SEED_APPOINTMENTS,
  SEED_CURRENT_USER,
  SEED_TIMESLOTS,
  SEED_USERS,
} from '../seed/seed.tokens';

const THIS_WEEK_OFFSET = 0;
const NEXT_WEEK_OFFSET = 1;

export const DEFAULT_USERS: User[] = [
  mockUser.COORDINATOR,
  mockUser.MEMBER,
  mockUser.PROSPECT,
];

export const DEFAULT_TIMESLOTS: Timeslot[] = [
  mockTimeslot.MONDAY_MORNING,
  mockTimeslot.WEDNESDAY_EVENING,
  mockTimeslot.SATURDAY_MORNING,
  mockTimeslot.WEDNESDAY_NOON,
  mockTimeslot.MONDAY_EVENING,
  mockTimeslot.FRIDAY_EVENING,
  mockTimeslot.SATURDAY_AFTERNOON,
];

interface SeedAppointment {
  /** Weeks after the current one the appointment is placed in */
  weekOffset: number;
  appointment: Appointment;
}

const DEFAULT_APPOINTMENTS: SeedAppointment[] = [
  {
    weekOffset: THIS_WEEK_OFFSET,
    appointment: mockAppointment.MEMBER_AVAILABLE,
  },
  {
    weekOffset: THIS_WEEK_OFFSET,
    appointment: mockAppointment.MIXED_AVAILABILITY,
  },
  { weekOffset: THIS_WEEK_OFFSET, appointment: mockAppointment.WITH_PROSPECT },
  {
    weekOffset: NEXT_WEEK_OFFSET,
    appointment: mockAppointment.COORDINATOR_IF_NEEDED,
  },
  { weekOffset: NEXT_WEEK_OFFSET, appointment: mockAppointment.CONFIRMED },
];

/**
 * Appointments in the week of the date and the one after, so there are always some around
 * today, with availabilities of the seeded users.
 */
export function createSeedAppointments(now = new Date()): Appointment[] {
  return DEFAULT_APPOINTMENTS.map(({ weekOffset, appointment }) => {
    const date = addWeeks(now, weekOffset);
    return {
      ...appointment,
      year: getISOWeekYear(date),
      week: getISOWeek(date),
    };
  });
}

/** Seeds the stubbed services with the mock users, timeslots and appointments around today */
export function provideSeedData(): Provider[] {
  return [
    { provide: SEED_USERS, useValue: DEFAULT_USERS },
    { provide: SEED_TIMESLOTS, useValue: DEFAULT_TIMESLOTS },
    { provide: SEED_APPOINTMENTS, useFactory: () => createSeedAppointments() },
    { provide: SEED_CURRENT_USER, useValue: mockUser.COORDINATOR },
  ];
}
