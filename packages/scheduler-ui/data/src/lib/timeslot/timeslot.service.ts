import { Injectable } from '@angular/core';
import {
  Appointment,
  Availability,
  AvailabilityStatus,
  Timeslot,
} from '@org/models';
import { addWeeks, getISOWeek, getISOWeekYear } from 'date-fns';
import { Observable, of, throwError } from 'rxjs';
import { SEED_USERS } from '../user/user.service';

export type TimeslotDraft = Omit<Timeslot, 'timeslotId'>;

export type TimeslotChanges = Partial<TimeslotDraft>;

export type AppointmentWeek = Pick<Appointment, 'year' | 'week'>;

const DAY_MONDAY = 1;
const DAY_WEDNESDAY = 3;
const DAY_FRIDAY = 5;
const DAY_SATURDAY = 6;

export const SEED_TIMESLOTS: Timeslot[] = [
  {
    timeslotId: 'mock-timeslot-1',
    start: '09:00',
    end: '10:00',
    dayOfWeek: DAY_MONDAY,
  },
  {
    timeslotId: 'mock-timeslot-2',
    start: '18:00',
    end: '19:30',
    dayOfWeek: DAY_WEDNESDAY,
  },
  {
    timeslotId: 'mock-timeslot-3',
    start: '11:00',
    end: '12:00',
    dayOfWeek: DAY_SATURDAY,
  },
  {
    timeslotId: 'mock-timeslot-4',
    start: '12:00',
    end: '13:00',
    dayOfWeek: DAY_WEDNESDAY,
  },
  {
    timeslotId: 'mock-timeslot-5',
    start: '19:00',
    end: '20:30',
    dayOfWeek: DAY_MONDAY,
  },
  {
    timeslotId: 'mock-timeslot-6',
    start: '17:00',
    end: '18:30',
    dayOfWeek: DAY_FRIDAY,
  },
  {
    timeslotId: 'mock-timeslot-7',
    start: '14:00',
    end: '15:30',
    dayOfWeek: DAY_SATURDAY,
  },
];

const [COORDINATOR, MEMBER, PROSPECT] = SEED_USERS;

function toAppointmentWeek(date: Date): AppointmentWeek {
  return { year: getISOWeekYear(date), week: getISOWeek(date) };
}

/**
 * Appointments in the week of the date and the one after, so there are always some around
 * today, with availabilities of the seeded users.
 */
export function createSeedAppointments(now = new Date()): Appointment[] {
  const thisWeek = toAppointmentWeek(now);
  const nextWeek = toAppointmentWeek(addWeeks(now, 1));

  return [
    {
      appointmentId: 'mock-appointment-1',
      timeslotId: 'mock-timeslot-1',
      ...thisWeek,
      availabilities: [
        { memberId: MEMBER.id, status: AvailabilityStatus.Available },
      ],
      confirmedUserIds: [],
    },
    {
      appointmentId: 'mock-appointment-2',
      timeslotId: 'mock-timeslot-2',
      ...thisWeek,
      availabilities: [
        { memberId: COORDINATOR.id, status: AvailabilityStatus.Available },
        { memberId: MEMBER.id, status: AvailabilityStatus.IfNeeded },
      ],
      confirmedUserIds: [],
    },
    {
      appointmentId: 'mock-appointment-3',
      timeslotId: 'mock-timeslot-6',
      ...thisWeek,
      availabilities: [
        { memberId: MEMBER.id, status: AvailabilityStatus.IfNeeded },
        { memberId: COORDINATOR.id, status: AvailabilityStatus.Unavailable },
      ],
      confirmedUserIds: [],
      prospectId: PROSPECT.id,
    },
    {
      appointmentId: 'mock-appointment-4',
      timeslotId: 'mock-timeslot-3',
      ...nextWeek,
      availabilities: [
        { memberId: COORDINATOR.id, status: AvailabilityStatus.IfNeeded },
      ],
      confirmedUserIds: [],
    },
    {
      appointmentId: 'mock-appointment-5',
      timeslotId: 'mock-timeslot-1',
      ...nextWeek,
      availabilities: [
        { memberId: MEMBER.id, status: AvailabilityStatus.Available },
        { memberId: COORDINATOR.id, status: AvailabilityStatus.Available },
      ],
      confirmedUserIds: [MEMBER.id],
    },
  ];
}

export function timeslotNotFoundMessage(id: string): string {
  return `Timeslot not found: ${id}`;
}

export function appointmentNotFoundMessage(id: string): string {
  return `Appointment not found: ${id}`;
}

@Injectable({
  providedIn: 'root',
})
export class TimeslotService {
  private timeslots = new Map<string, Timeslot>(
    SEED_TIMESLOTS.map((timeslot) => [timeslot.timeslotId, timeslot]),
  );
  private appointments = new Map<string, Appointment>(
    createSeedAppointments().map((appointment) => [
      appointment.appointmentId,
      appointment,
    ]),
  );

  getTimeslots(): Observable<Timeslot[]> {
    return of([...this.timeslots.values()]);
  }

  getTimeslotById(id: string): Observable<Timeslot | null> {
    return of(this.timeslots.get(id) ?? null);
  }

  createTimeslot(draft: TimeslotDraft): Observable<Timeslot> {
    const timeslot: Timeslot = { ...draft, timeslotId: crypto.randomUUID() };
    this.timeslots.set(timeslot.timeslotId, timeslot);
    return of(timeslot);
  }

  updateTimeslot(id: string, changes: TimeslotChanges): Observable<Timeslot> {
    const existing = this.timeslots.get(id);
    if (!existing) {
      return throwError(() => new Error(timeslotNotFoundMessage(id)));
    }

    const updated: Timeslot = { ...existing, ...changes, timeslotId: id };
    this.timeslots.set(id, updated);
    return of(updated);
  }

  /** Deleting a timeslot also removes the appointments created from it */
  deleteTimeslot(id: string): Observable<void> {
    if (!this.timeslots.delete(id)) {
      return throwError(() => new Error(timeslotNotFoundMessage(id)));
    }

    for (const appointment of this.appointments.values()) {
      if (appointment.timeslotId === id) {
        this.appointments.delete(appointment.appointmentId);
      }
    }
    return of(undefined);
  }

  getAppointments(): Observable<Appointment[]> {
    return of([...this.appointments.values()]);
  }

  getAppointmentsByWeek(week: AppointmentWeek): Observable<Appointment[]> {
    return of(
      [...this.appointments.values()].filter(
        (appointment) =>
          appointment.year === week.year && appointment.week === week.week,
      ),
    );
  }

  getAppointmentById(id: string): Observable<Appointment | null> {
    return of(this.appointments.get(id) ?? null);
  }

  createAppointment(
    timeslotId: string,
    week: AppointmentWeek,
  ): Observable<Appointment> {
    if (!this.timeslots.has(timeslotId)) {
      return throwError(() => new Error(timeslotNotFoundMessage(timeslotId)));
    }

    const appointment: Appointment = {
      appointmentId: crypto.randomUUID(),
      timeslotId,
      year: week.year,
      week: week.week,
      availabilities: [],
      confirmedUserIds: [],
    };
    this.appointments.set(appointment.appointmentId, appointment);
    return of(appointment);
  }

  /** Adds the member's availability, replacing any existing entry for them */
  setAvailability(
    appointmentId: string,
    availability: Availability,
  ): Observable<Appointment> {
    return this.updateAppointment(appointmentId, (appointment) => ({
      availabilities: [
        ...appointment.availabilities.filter(
          (existing) => existing.memberId !== availability.memberId,
        ),
        availability,
      ],
    }));
  }

  /** Removing a member with no availability set leaves the appointment unchanged */
  removeAvailability(
    appointmentId: string,
    memberId: string,
  ): Observable<Appointment> {
    return this.updateAppointment(appointmentId, (appointment) => ({
      availabilities: appointment.availabilities.filter(
        (existing) => existing.memberId !== memberId,
      ),
    }));
  }

  setConfirmedUsers(
    appointmentId: string,
    confirmedUserIds: string[],
  ): Observable<Appointment> {
    return this.updateAppointment(appointmentId, () => ({
      confirmedUserIds: [...confirmedUserIds],
    }));
  }

  /** Passing no prospect clears the appointment's prospect */
  setProspect(
    appointmentId: string,
    prospectId?: string,
  ): Observable<Appointment> {
    return this.updateAppointment(appointmentId, () => ({ prospectId }));
  }

  private updateAppointment(
    id: string,
    getChanges: (existing: Appointment) => Partial<Appointment>,
  ): Observable<Appointment> {
    const existing = this.appointments.get(id);
    if (!existing) {
      return throwError(() => new Error(appointmentNotFoundMessage(id)));
    }

    const updated: Appointment = {
      ...existing,
      ...getChanges(existing),
      appointmentId: id,
    };
    this.appointments.set(id, updated);
    return of(updated);
  }
}
