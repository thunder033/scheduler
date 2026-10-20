import { Component, computed, inject, input, signal } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { Store } from '@ngxs/store';
import { Appointment, Timeslot } from '@org/models';
import { ExpandableCard } from '@org/scheduler-ui/core-ui';
import { LocalUserState } from '@org/scheduler-ui/state';
import { AvailabilityStatusComponent } from '../availability-status/availability-status.component';
import {
  ADD_AVAILABILITY_LABEL,
  formatTimeRange,
} from '../open-timeslot-card/open-timeslot-card.component';

export const EDIT_AVAILABILITY_LABEL = 'Edit availability';

/**
 * A timeslot of a week that has an appointment, which shows the availability of the current user,
 * and expands for them to add or change it
 */
@Component({
  selector: 'lib-appointment-card',
  imports: [AvailabilityStatusComponent, MatButton, MatIcon, MatIconButton],
  templateUrl: './appointment-card.component.html',
  styleUrl: './appointment-card.component.scss',
  host: {
    class: 'block rounded-lg border-4 border-solid border-outline-variant p-2',
  },
})
export class AppointmentCardComponent extends ExpandableCard {
  readonly timeslot = input.required<Timeslot>();
  readonly appointment = input.required<Appointment>();

  private readonly currentUser = inject(Store).selectSignal(
    LocalUserState.currentUser,
  );
  private readonly editing = signal(false);

  protected readonly addAvailabilityLabel = ADD_AVAILABILITY_LABEL;
  protected readonly editAvailabilityLabel = EDIT_AVAILABILITY_LABEL;
  protected readonly timeRange = computed(() =>
    formatTimeRange(this.timeslot()),
  );
  /** The status the current user set, if they have */
  protected readonly status = computed(() => {
    const user = this.currentUser();
    return this.appointment().availabilities.find(
      ({ memberId }) => memberId === user?.id,
    )?.status;
  });
  /** The card expands for the availability to be added or changed */
  readonly expanded = this.editing.asReadonly();

  protected toggleEditing(): void {
    this.editing.update((editing) => !editing);
  }
}
