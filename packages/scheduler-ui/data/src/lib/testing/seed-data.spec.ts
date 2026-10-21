import { addWeeks, getISOWeek, getISOWeekYear } from 'date-fns';
import {
  DEFAULT_TIMESLOTS,
  DEFAULT_USERS,
  createSeedAppointments,
} from './seed-data';

const TODAY = new Date(2026, 9, 19);

function setup(now = TODAY) {
  return {
    timeslotIds: DEFAULT_TIMESLOTS.map(({ timeslotId }) => timeslotId),
    userIds: DEFAULT_USERS.map(({ id }) => id),
    appointments: createSeedAppointments(now),
  };
}

describe('seed data', () => {
  it('should give every seeded user its own id', () => {
    const { userIds } = setup();

    expect(new Set(userIds).size).toBe(userIds.length);
  });

  it('should give every seeded timeslot its own id', () => {
    const { timeslotIds } = setup();

    expect(new Set(timeslotIds).size).toBe(timeslotIds.length);
  });

  describe('createSeedAppointments', () => {
    it('should seed appointments only for seeded timeslots', () => {
      const { appointments, timeslotIds } = setup();

      for (const appointment of appointments) {
        expect(timeslotIds).toContain(appointment.timeslotId);
      }
    });

    it('should seed availabilities and confirmations only for seeded users', () => {
      const { appointments, userIds } = setup();

      for (const appointment of appointments) {
        const referenced = [
          ...appointment.availabilities.map(
            ({ participantId }) => participantId,
          ),
          ...appointment.confirmedUserIds,
          ...(appointment.prospectId ? [appointment.prospectId] : []),
        ];
        for (const userId of referenced) {
          expect(userIds).toContain(userId);
        }
      }
    });

    it('should seed appointments in the week of the date and the week after', () => {
      const { appointments } = setup();
      const thisWeek = { year: getISOWeekYear(TODAY), week: getISOWeek(TODAY) };
      const nextWeek = {
        year: getISOWeekYear(addWeeks(TODAY, 1)),
        week: getISOWeek(addWeeks(TODAY, 1)),
      };

      const weeks = appointments.map(({ year, week }) => ({ year, week }));

      expect(weeks).toContainEqual(thisWeek);
      expect(weeks).toContainEqual(nextWeek);
      for (const week of weeks) {
        expect([thisWeek, nextWeek]).toContainEqual(week);
      }
    });

    it('should seed each timeslot at most once per week', () => {
      const { appointments } = setup();

      const keys = appointments.map(
        ({ timeslotId, year, week }) => `${timeslotId}/${year}/${week}`,
      );

      expect(new Set(keys).size).toBe(keys.length);
    });

    it('should keep the same appointment ids however often it is called', () => {
      const { appointments } = setup();
      const later = createSeedAppointments(addWeeks(TODAY, 10));

      expect(later.map(({ appointmentId }) => appointmentId)).toEqual(
        appointments.map(({ appointmentId }) => appointmentId),
      );
    });
  });
});
