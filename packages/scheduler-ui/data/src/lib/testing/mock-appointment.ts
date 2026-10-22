import { Appointment, AvailabilityStatus } from '@scheduler/models';
import { nextMockId } from './mock-id';
import { mockTimeslot } from './mock-timeslot';
import { mockUser } from './mock-user';

const DEFAULT_YEAR = 2026;
const DEFAULT_WEEK = 1;

/** Not linked to a mock timeslot unless `timeslotId` is overridden */
const DEFAULT_TIMESLOT_ID = 'timeslot-1';

function createMockAppointment(
  overrides: Partial<Appointment> = {},
): Appointment {
  return {
    appointmentId: nextMockId('appointment'),
    timeslotId: DEFAULT_TIMESLOT_ID,
    year: DEFAULT_YEAR,
    week: DEFAULT_WEEK,
    availabilities: [],
    confirmedUserIds: [],
    ...overrides,
  };
}

/**
 * Creates an appointment; the seeded appointments, one per way an appointment can stand, are
 * properties of the factory. They are all in the default week.
 */
export const mockAppointment = Object.assign(createMockAppointment, {
  MEMBER_AVAILABLE: createMockAppointment({
    timeslotId: mockTimeslot.MONDAY_MORNING.timeslotId,
    availabilities: [
      {
        participantId: mockUser.MEMBER.id,
        status: AvailabilityStatus.Available,
      },
    ],
  }),
  MIXED_AVAILABILITY: createMockAppointment({
    timeslotId: mockTimeslot.WEDNESDAY_EVENING.timeslotId,
    availabilities: [
      {
        participantId: mockUser.COORDINATOR.id,
        status: AvailabilityStatus.Available,
      },
      {
        participantId: mockUser.MEMBER.id,
        status: AvailabilityStatus.IfNeeded,
      },
    ],
  }),
  WITH_PROSPECT: createMockAppointment({
    timeslotId: mockTimeslot.FRIDAY_EVENING.timeslotId,
    availabilities: [
      {
        participantId: mockUser.MEMBER.id,
        status: AvailabilityStatus.IfNeeded,
      },
      {
        participantId: mockUser.COORDINATOR.id,
        status: AvailabilityStatus.Unavailable,
      },
    ],
    prospectId: mockUser.PROSPECT.id,
  }),
  COORDINATOR_IF_NEEDED: createMockAppointment({
    timeslotId: mockTimeslot.SATURDAY_MORNING.timeslotId,
    availabilities: [
      {
        participantId: mockUser.COORDINATOR.id,
        status: AvailabilityStatus.IfNeeded,
      },
    ],
  }),
  CONFIRMED: createMockAppointment({
    timeslotId: mockTimeslot.MONDAY_MORNING.timeslotId,
    availabilities: [
      {
        participantId: mockUser.MEMBER.id,
        status: AvailabilityStatus.Available,
      },
      {
        participantId: mockUser.COORDINATOR.id,
        status: AvailabilityStatus.Available,
      },
    ],
    confirmedUserIds: [mockUser.MEMBER.id],
  }),
});
