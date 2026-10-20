import { Component, computed, inject, input, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption, MatSelect } from '@angular/material/select';
import { Store } from '@ngxs/store';
import { Appointment, AvailabilityStatus, Timeslot } from '@org/models';
import { AppointmentWeek } from '@org/scheduler-ui/data';
import {
  CreateAppointment,
  LocalUserState,
  PlanningState,
  SetAvailability,
} from '@org/scheduler-ui/state';
import { firstValueFrom } from 'rxjs';

export const ADD_AVAILABILITY_LABEL = 'Add availability';
export const AVAILABILITY_LABEL = 'Availability';
export const SAVE_AVAILABILITY_LABEL = 'Save';
export const AVAILABILITY_STATUS_LABELS: Record<AvailabilityStatus, string> = {
  [AvailabilityStatus.Available]: 'Available',
  [AvailabilityStatus.IfNeeded]: 'If needed',
};
const APPOINTMENT_NOT_CREATED_MESSAGE =
  'The appointment was not found after creating it';

const TIME_RANGE_SEPARATOR = ' – ';
const DEFAULT_AVAILABILITY_STATUS = AvailabilityStatus.Available;

export function formatTimeRange({
  start,
  end,
}: Pick<Timeslot, 'start' | 'end'>): string {
  return `${start}${TIME_RANGE_SEPARATOR}${end}`;
}

/** A timeslot of a week, which the current user can add their availability for */
@Component({
  selector: 'lib-open-timeslot-card',
  imports: [FormField, MatButton, MatFormField, MatLabel, MatOption, MatSelect],
  templateUrl: './open-timeslot-card.component.html',
  styleUrl: './open-timeslot-card.component.scss',
  host: {
    class: 'block rounded-lg border-4 border-dashed border-outline-variant p-2',
  },
})
export class OpenTimeslotCardComponent {
  private readonly store = inject(Store);

  readonly timeslot = input.required<Timeslot>();
  /** The week the card is in, which the appointment for the timeslot belongs to */
  readonly week = input.required<AppointmentWeek>();

  protected readonly addAvailabilityLabel = ADD_AVAILABILITY_LABEL;
  protected readonly availabilityLabel = AVAILABILITY_LABEL;
  protected readonly saveLabel = SAVE_AVAILABILITY_LABEL;
  protected readonly statuses = Object.values(AvailabilityStatus);
  protected readonly statusLabels = AVAILABILITY_STATUS_LABELS;
  protected readonly timeRange = computed(() =>
    formatTimeRange(this.timeslot()),
  );

  /** Whether the options are shown in place of the control that starts adding */
  protected readonly adding = signal(false);
  private readonly saving = signal(false);
  private readonly currentUser = this.store.selectSignal(
    LocalUserState.currentUser,
  );
  private readonly availability = signal({
    status: DEFAULT_AVAILABILITY_STATUS,
  });
  protected readonly availabilityForm = form(this.availability);
  /** Availability is for the current user, and is saved once at a time */
  protected readonly canSave = computed(
    () => this.currentUser() !== null && !this.saving(),
  );

  protected startAdding(): void {
    this.adding.set(true);
  }

  /** Adds to the appointment of the timeslot in the week, which is created if there is none */
  protected async save(): Promise<void> {
    const user = this.currentUser();
    if (!user || this.saving()) {
      return;
    }

    this.saving.set(true);
    try {
      const { appointmentId } = await this.getOrCreateAppointment();
      await firstValueFrom(
        this.store.dispatch(
          new SetAvailability(appointmentId, {
            memberId: user.id,
            status: this.availability().status,
          }),
        ),
      );
      this.availability.set({ status: DEFAULT_AVAILABILITY_STATUS });
      this.adding.set(false);
    } finally {
      this.saving.set(false);
    }
  }

  private async getOrCreateAppointment(): Promise<Appointment> {
    const { timeslotId } = this.timeslot();
    const week = this.week();
    const find = () =>
      this.store
        .selectSnapshot(PlanningState.appointmentsByWeek(week))
        .find((appointment) => appointment.timeslotId === timeslotId);

    const existing = find();
    if (existing) {
      return existing;
    }

    await firstValueFrom(
      this.store.dispatch(new CreateAppointment(timeslotId, week)),
    );
    const created = find();
    if (!created) {
      throw new Error(APPOINTMENT_NOT_CREATED_MESSAGE);
    }
    return created;
  }
}
