import { Timeslot } from '@org/models';
import { TimeslotDraft } from '../timeslot/timeslot.service';
import { nextMockId } from './mock-id';

const DEFAULT_START = '09:00';
const DEFAULT_END = '10:00';
const DEFAULT_DAY_OF_WEEK = 1;

const DAY_MONDAY = 1;
const DAY_WEDNESDAY = 3;
const DAY_FRIDAY = 5;
const DAY_SATURDAY = 6;

function createMockTimeslotDraft(
  overrides: Partial<TimeslotDraft> = {},
): TimeslotDraft {
  return {
    start: DEFAULT_START,
    end: DEFAULT_END,
    dayOfWeek: DEFAULT_DAY_OF_WEEK,
    ...overrides,
  };
}

function createMockTimeslot(overrides: Partial<Timeslot> = {}): Timeslot {
  return {
    timeslotId: nextMockId('timeslot'),
    ...createMockTimeslotDraft(),
    ...overrides,
  };
}

/** Creates a timeslot without an id, as it is before the service creates it */
export const mockTimeslotDraft = createMockTimeslotDraft;

/** Creates a timeslot; the seeded timeslots, named by day and time, are properties of the factory */
export const mockTimeslot = Object.assign(createMockTimeslot, {
  MONDAY_MORNING: createMockTimeslot({
    start: '09:00',
    end: '10:00',
    dayOfWeek: DAY_MONDAY,
  }),
  WEDNESDAY_EVENING: createMockTimeslot({
    start: '18:00',
    end: '19:30',
    dayOfWeek: DAY_WEDNESDAY,
  }),
  SATURDAY_MORNING: createMockTimeslot({
    start: '11:00',
    end: '12:00',
    dayOfWeek: DAY_SATURDAY,
  }),
  WEDNESDAY_NOON: createMockTimeslot({
    start: '12:00',
    end: '13:00',
    dayOfWeek: DAY_WEDNESDAY,
  }),
  MONDAY_EVENING: createMockTimeslot({
    start: '19:00',
    end: '20:30',
    dayOfWeek: DAY_MONDAY,
  }),
  FRIDAY_EVENING: createMockTimeslot({
    start: '17:00',
    end: '18:30',
    dayOfWeek: DAY_FRIDAY,
  }),
  SATURDAY_AFTERNOON: createMockTimeslot({
    start: '14:00',
    end: '15:30',
    dayOfWeek: DAY_SATURDAY,
  }),
});
