import { TestBed } from '@angular/core/testing';
import {
  Appointment,
  Availability,
  AvailabilityStatus,
  Timeslot,
} from '@org/models';
import { firstValueFrom } from 'rxjs';
import { SEED_APPOINTMENTS, SEED_TIMESLOTS } from '../seed/seed.tokens';
import { mockAppointment } from '../testing/mock-appointment';
import { mockTimeslot, mockTimeslotDraft } from '../testing/mock-timeslot';
import {
  AppointmentWeek,
  TimeslotDraft,
  TimeslotService,
  appointmentNotFoundMessage,
  timeslotNotFoundMessage,
} from './timeslot.service';

/** A year long past, so its weeks have none of the seeded appointments unless a test seeds them */
const PAST_YEAR = 2001;
const MISSING_TIMESLOT_ID = 'missing-timeslot';
const MISSING_APPOINTMENT_ID = 'missing-appointment';

function createAppointmentWeek(
  overrides: Partial<AppointmentWeek> = {},
): AppointmentWeek {
  return { year: PAST_YEAR, week: 42, ...overrides };
}

function createAvailability(
  overrides: Partial<Availability> = {},
): Availability {
  return {
    participantId: 'member-1',
    status: AvailabilityStatus.Available,
    ...overrides,
  };
}

interface SetupSeeds {
  timeslots?: Timeslot[];
  appointments?: Appointment[];
}

async function setup({
  timeslots = [mockTimeslot.MONDAY_MORNING, mockTimeslot.WEDNESDAY_EVENING],
  appointments = [
    mockAppointment.MEMBER_AVAILABLE,
    mockAppointment.MIXED_AVAILABILITY,
  ],
}: SetupSeeds = {}) {
  TestBed.configureTestingModule({
    providers: [
      { provide: SEED_TIMESLOTS, useValue: timeslots },
      { provide: SEED_APPOINTMENTS, useValue: appointments },
    ],
  });
  const service = TestBed.inject(TimeslotService);
  const timeslot = await firstValueFrom(
    service.createTimeslot(mockTimeslotDraft()),
  );
  const appointment = await firstValueFrom(
    service.createAppointment(timeslot.timeslotId, createAppointmentWeek()),
  );
  return { service, timeslot, appointment, timeslots, appointments };
}

describe('TimeslotService', () => {
  describe('createTimeslot', () => {
    it('should create a timeslot with a generated id that can be retrieved', async () => {
      const { service } = await setup();
      const draft = mockTimeslotDraft();

      const created = await firstValueFrom(service.createTimeslot(draft));

      expect(created).toEqual({ ...draft, timeslotId: created.timeslotId });
      expect(
        await firstValueFrom(service.getTimeslotById(created.timeslotId)),
      ).toEqual(created);
    });

    it('should generate a distinct id for each timeslot', async () => {
      const { service, timeslot } = await setup();

      const other = await firstValueFrom(
        service.createTimeslot(mockTimeslotDraft()),
      );

      expect(other.timeslotId).not.toBe(timeslot.timeslotId);
    });
  });

  describe('getTimeslots', () => {
    it('should include created timeslots', async () => {
      const { service, timeslot } = await setup();

      expect(await firstValueFrom(service.getTimeslots())).toContainEqual(
        timeslot,
      );
    });

    it('should not expose internal state to mutation', async () => {
      const { service } = await setup();
      const before = await firstValueFrom(service.getTimeslots());

      (await firstValueFrom(service.getTimeslots())).pop();

      expect(await firstValueFrom(service.getTimeslots())).toEqual(before);
    });
  });

  describe('getTimeslotById', () => {
    it('should emit null when the timeslot does not exist', async () => {
      const { service } = await setup();

      expect(
        await firstValueFrom(service.getTimeslotById(MISSING_TIMESLOT_ID)),
      ).toBeNull();
    });
  });

  describe('updateTimeslot', () => {
    it('should apply the changes and keep the id', async () => {
      const { service, timeslot } = await setup();
      const changes = { start: '15:00', end: '16:30' };

      const updated = await firstValueFrom(
        service.updateTimeslot(timeslot.timeslotId, changes),
      );

      expect(updated).toEqual({ ...timeslot, ...changes });
      expect(
        await firstValueFrom(service.getTimeslotById(timeslot.timeslotId)),
      ).toEqual(updated);
    });

    it('should error when the timeslot does not exist', async () => {
      const { service } = await setup();

      await expect(
        firstValueFrom(service.updateTimeslot(MISSING_TIMESLOT_ID, {})),
      ).rejects.toThrow(timeslotNotFoundMessage(MISSING_TIMESLOT_ID));
    });
  });

  describe('deleteTimeslot', () => {
    it('should remove the timeslot', async () => {
      const { service, timeslot } = await setup();

      await firstValueFrom(service.deleteTimeslot(timeslot.timeslotId), {
        defaultValue: undefined,
      });

      expect(
        await firstValueFrom(service.getTimeslotById(timeslot.timeslotId)),
      ).toBeNull();
    });

    it('should remove the appointments created from the timeslot', async () => {
      const { service, timeslot, appointment } = await setup();

      await firstValueFrom(service.deleteTimeslot(timeslot.timeslotId), {
        defaultValue: undefined,
      });

      expect(
        await firstValueFrom(
          service.getAppointmentById(appointment.appointmentId),
        ),
      ).toBeNull();
    });

    it('should keep appointments for other timeslots', async () => {
      const { service, timeslot } = await setup();
      const other = await firstValueFrom(
        service.createTimeslot(mockTimeslotDraft()),
      );
      const otherAppointment = await firstValueFrom(
        service.createAppointment(other.timeslotId, createAppointmentWeek()),
      );

      await firstValueFrom(service.deleteTimeslot(timeslot.timeslotId), {
        defaultValue: undefined,
      });

      expect(await firstValueFrom(service.getAppointments())).toContainEqual(
        otherAppointment,
      );
    });

    it('should error when the timeslot does not exist', async () => {
      const { service } = await setup();

      await expect(
        firstValueFrom(service.deleteTimeslot(MISSING_TIMESLOT_ID)),
      ).rejects.toThrow(timeslotNotFoundMessage(MISSING_TIMESLOT_ID));
    });
  });

  describe('createAppointment', () => {
    it('should create an empty appointment for the timeslot in the given week', async () => {
      const { service, timeslot } = await setup();
      const week = createAppointmentWeek({ week: 43 });

      const created = await firstValueFrom(
        service.createAppointment(timeslot.timeslotId, week),
      );

      expect(created).toEqual({
        ...week,
        appointmentId: created.appointmentId,
        timeslotId: timeslot.timeslotId,
        availabilities: [],
        confirmedUserIds: [],
      });
      expect(
        await firstValueFrom(service.getAppointmentById(created.appointmentId)),
      ).toEqual(created);
    });

    it('should generate a distinct id for each appointment', async () => {
      const { service, timeslot, appointment } = await setup();

      const other = await firstValueFrom(
        service.createAppointment(timeslot.timeslotId, createAppointmentWeek()),
      );

      expect(other.appointmentId).not.toBe(appointment.appointmentId);
    });

    it('should error when the timeslot does not exist', async () => {
      const { service } = await setup();

      await expect(
        firstValueFrom(
          service.createAppointment(
            MISSING_TIMESLOT_ID,
            createAppointmentWeek(),
          ),
        ),
      ).rejects.toThrow(timeslotNotFoundMessage(MISSING_TIMESLOT_ID));
    });
  });

  describe('getAppointments', () => {
    it('should include created appointments', async () => {
      const { service, appointment } = await setup();

      expect(await firstValueFrom(service.getAppointments())).toContainEqual(
        appointment,
      );
    });
  });

  describe('getAppointmentsByWeek', () => {
    it('should only include appointments in the given week', async () => {
      const { service, timeslot, appointment } = await setup();
      const otherWeek = createAppointmentWeek({ week: appointment.week + 1 });
      const otherYear = createAppointmentWeek({ year: appointment.year + 1 });
      for (const week of [otherWeek, otherYear]) {
        await firstValueFrom(
          service.createAppointment(timeslot.timeslotId, week),
        );
      }

      const appointments = await firstValueFrom(
        service.getAppointmentsByWeek(appointment),
      );

      expect(appointments).toEqual([appointment]);
    });

    it('should emit an empty list when the week has no appointments', async () => {
      const { service, appointment } = await setup();

      expect(
        await firstValueFrom(
          service.getAppointmentsByWeek({
            year: appointment.year,
            week: appointment.week + 1,
          }),
        ),
      ).toEqual([]);
    });
  });

  describe('getAppointmentById', () => {
    it('should emit null when the appointment does not exist', async () => {
      const { service } = await setup();

      expect(
        await firstValueFrom(
          service.getAppointmentById(MISSING_APPOINTMENT_ID),
        ),
      ).toBeNull();
    });
  });

  describe('setAvailability', () => {
    it('should add the availability to the appointment', async () => {
      const { service, appointment } = await setup();
      const availability = createAvailability();

      const updated = await firstValueFrom(
        service.setAvailability(appointment.appointmentId, availability),
      );

      expect(updated.availabilities).toEqual([availability]);
      expect(
        await firstValueFrom(
          service.getAppointmentById(appointment.appointmentId),
        ),
      ).toEqual(updated);
    });

    it('should replace the existing availability for the same participant', async () => {
      const { service, appointment } = await setup();
      const other = createAvailability({ participantId: 'member-2' });
      const replacement = createAvailability({
        status: AvailabilityStatus.IfNeeded,
      });
      await firstValueFrom(
        service.setAvailability(
          appointment.appointmentId,
          createAvailability(),
        ),
      );
      await firstValueFrom(
        service.setAvailability(appointment.appointmentId, other),
      );

      const updated = await firstValueFrom(
        service.setAvailability(appointment.appointmentId, replacement),
      );

      expect(updated.availabilities).toHaveLength(2);
      expect(updated.availabilities).toContainEqual(replacement);
      expect(updated.availabilities).toContainEqual(other);
    });

    it('should error when the appointment does not exist', async () => {
      const { service } = await setup();

      await expect(
        firstValueFrom(
          service.setAvailability(MISSING_APPOINTMENT_ID, createAvailability()),
        ),
      ).rejects.toThrow(appointmentNotFoundMessage(MISSING_APPOINTMENT_ID));
    });
  });

  describe('removeAvailability', () => {
    it("should remove only the given participant's availability", async () => {
      const { service, appointment } = await setup();
      const removed = createAvailability();
      const kept = createAvailability({ participantId: 'member-2' });
      for (const availability of [removed, kept]) {
        await firstValueFrom(
          service.setAvailability(appointment.appointmentId, availability),
        );
      }

      const updated = await firstValueFrom(
        service.removeAvailability(
          appointment.appointmentId,
          removed.participantId,
        ),
      );

      expect(updated.availabilities).toEqual([kept]);
      expect(
        await firstValueFrom(
          service.getAppointmentById(appointment.appointmentId),
        ),
      ).toEqual(updated);
    });

    it('should leave the appointment unchanged when the participant has no availability', async () => {
      const { service, appointment } = await setup();

      const updated = await firstValueFrom(
        service.removeAvailability(appointment.appointmentId, 'member-1'),
      );

      expect(updated).toEqual(appointment);
    });

    it('should error when the appointment does not exist', async () => {
      const { service } = await setup();

      await expect(
        firstValueFrom(
          service.removeAvailability(MISSING_APPOINTMENT_ID, 'member-1'),
        ),
      ).rejects.toThrow(appointmentNotFoundMessage(MISSING_APPOINTMENT_ID));
    });
  });

  describe('setConfirmedUsers', () => {
    it('should replace the confirmed users', async () => {
      const { service, appointment } = await setup();
      await firstValueFrom(
        service.setConfirmedUsers(appointment.appointmentId, ['user-1']),
      );
      const confirmedUserIds = ['user-2', 'user-3'];

      const updated = await firstValueFrom(
        service.setConfirmedUsers(appointment.appointmentId, confirmedUserIds),
      );

      expect(updated.confirmedUserIds).toEqual(confirmedUserIds);
      expect(
        await firstValueFrom(
          service.getAppointmentById(appointment.appointmentId),
        ),
      ).toEqual(updated);
    });

    it('should not retain a reference to the provided list', async () => {
      const { service, appointment } = await setup();
      const confirmedUserIds = ['user-1'];
      await firstValueFrom(
        service.setConfirmedUsers(appointment.appointmentId, confirmedUserIds),
      );

      confirmedUserIds.push('user-2');

      const stored = await firstValueFrom(
        service.getAppointmentById(appointment.appointmentId),
      );
      expect(stored?.confirmedUserIds).toEqual(['user-1']);
    });

    it('should error when the appointment does not exist', async () => {
      const { service } = await setup();

      await expect(
        firstValueFrom(service.setConfirmedUsers(MISSING_APPOINTMENT_ID, [])),
      ).rejects.toThrow(appointmentNotFoundMessage(MISSING_APPOINTMENT_ID));
    });
  });

  describe('setProspect', () => {
    it('should set the prospect on the appointment', async () => {
      const { service, appointment } = await setup();

      const updated = await firstValueFrom(
        service.setProspect(appointment.appointmentId, 'prospect-1'),
      );

      expect(updated.prospectId).toBe('prospect-1');
      expect(
        await firstValueFrom(
          service.getAppointmentById(appointment.appointmentId),
        ),
      ).toEqual(updated);
    });

    it('should clear the prospect when none is provided', async () => {
      const { service, appointment } = await setup();
      await firstValueFrom(
        service.setProspect(appointment.appointmentId, 'prospect-1'),
      );

      const updated = await firstValueFrom(
        service.setProspect(appointment.appointmentId),
      );

      expect(updated.prospectId).toBeUndefined();
    });

    it('should error when the appointment does not exist', async () => {
      const { service } = await setup();

      await expect(
        firstValueFrom(
          service.setProspect(MISSING_APPOINTMENT_ID, 'prospect-1'),
        ),
      ).rejects.toThrow(appointmentNotFoundMessage(MISSING_APPOINTMENT_ID));
    });
  });

  describe('seeded data', () => {
    it('should start with the seeded timeslots and appointments', async () => {
      const { service, timeslot, appointment, timeslots, appointments } =
        await setup();

      expect(await firstValueFrom(service.getTimeslots())).toEqual([
        ...timeslots,
        timeslot,
      ]);
      expect(await firstValueFrom(service.getAppointments())).toEqual([
        ...appointments,
        appointment,
      ]);
    });

    it('should start without timeslots and appointments when none are seeded', async () => {
      const { service, timeslot, appointment } = await setup({
        timeslots: [],
        appointments: [],
      });

      expect(await firstValueFrom(service.getTimeslots())).toEqual([timeslot]);
      expect(await firstValueFrom(service.getAppointments())).toEqual([
        appointment,
      ]);
    });

    it('should remove the seeded appointments of a deleted seeded timeslot', async () => {
      const deleted = mockTimeslot.MONDAY_MORNING;
      const kept = mockAppointment.WITH_PROSPECT;
      const { service } = await setup({
        timeslots: [deleted, mockTimeslot.FRIDAY_EVENING],
        appointments: [
          mockAppointment.MEMBER_AVAILABLE,
          mockAppointment.CONFIRMED,
          kept,
        ],
      });

      await firstValueFrom(service.deleteTimeslot(deleted.timeslotId), {
        defaultValue: undefined,
      });

      const appointments = await firstValueFrom(service.getAppointments());
      expect(appointments).toContainEqual(kept);
      expect(
        appointments.filter(
          ({ timeslotId }) => timeslotId === deleted.timeslotId,
        ),
      ).toEqual([]);
    });
  });
});
