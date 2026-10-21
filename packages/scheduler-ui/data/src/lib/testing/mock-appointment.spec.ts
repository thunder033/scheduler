import { Appointment, AvailabilityStatus, Timeslot } from '@org/models';
import { mockAppointment } from './mock-appointment';
import { resetMockIds } from './mock-id';
import { mockTimeslot } from './mock-timeslot';

function setup(overrides: Partial<Appointment> = {}) {
  resetMockIds();
  return { appointment: mockAppointment(overrides) };
}

describe('mockAppointment', () => {
  it('creates an appointment with no participants and no prospect', () => {
    const { appointment } = setup();

    expect(appointment.appointmentId).toBeTruthy();
    expect(appointment.availabilities).toEqual([]);
    expect(appointment.confirmedUserIds).toEqual([]);
    expect(appointment.prospectId).toBeUndefined();
  });

  it('applies the overrides over the defaults', () => {
    const overrides: Partial<Appointment> = {
      timeslotId: 'timeslot-7',
      year: 2027,
      week: 12,
      availabilities: [
        { participantId: 'user-2', status: AvailabilityStatus.IfNeeded },
      ],
      confirmedUserIds: ['user-2'],
      prospectId: 'user-3',
    };

    const { appointment } = setup(overrides);

    expect(appointment).toMatchObject(overrides);
  });

  it('gives each appointment a distinct id', () => {
    const { appointment } = setup();

    expect(mockAppointment().appointmentId).not.toBe(appointment.appointmentId);
  });

  it('keeps an overridden id', () => {
    const { appointment } = setup({ appointmentId: 'custom-id' });

    expect(appointment.appointmentId).toBe('custom-id');
  });

  describe('seeded appointments', () => {
    const seeded: Appointment[] = Object.values(mockAppointment);

    it('gives every seeded appointment its own id', () => {
      const ids = seeded.map(({ appointmentId }) => appointmentId);

      expect(new Set(ids).size).toBe(ids.length);
    });

    it('seeds appointments only for seeded timeslots', () => {
      const timeslotIds: string[] = Object.values<Timeslot>(mockTimeslot).map(
        ({ timeslotId }) => timeslotId,
      );

      for (const { timeslotId } of seeded) {
        expect(timeslotIds).toContain(timeslotId);
      }
    });
  });
});
