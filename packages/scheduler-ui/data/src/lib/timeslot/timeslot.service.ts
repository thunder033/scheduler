import { Injectable, inject } from '@angular/core';
import { Appointment, Availability, Timeslot } from '@scheduler/models';
import { Observable, of, throwError } from 'rxjs';
import { SEED_APPOINTMENTS, SEED_TIMESLOTS } from '../seed/seed.tokens';

export type TimeslotDraft = Omit<Timeslot, 'timeslotId'>;

export type TimeslotChanges = Partial<TimeslotDraft>;

export type AppointmentWeek = Pick<Appointment, 'year' | 'week'>;

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
    inject(SEED_TIMESLOTS).map((timeslot) => [timeslot.timeslotId, timeslot]),
  );
  private appointments = new Map<string, Appointment>(
    inject(SEED_APPOINTMENTS).map((appointment) => [
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

  /** Adds the participant's availability, replacing any existing entry for them */
  setAvailability(
    appointmentId: string,
    availability: Availability,
  ): Observable<Appointment> {
    return this.updateAppointment(appointmentId, (appointment) => ({
      availabilities: [
        ...appointment.availabilities.filter(
          (existing) => existing.participantId !== availability.participantId,
        ),
        availability,
      ],
    }));
  }

  /** Removing a participant with no availability set leaves the appointment unchanged */
  removeAvailability(
    appointmentId: string,
    participantId: string,
  ): Observable<Appointment> {
    return this.updateAppointment(appointmentId, (appointment) => ({
      availabilities: appointment.availabilities.filter(
        (existing) => existing.participantId !== participantId,
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
