import { Component, computed, inject, input } from '@angular/core';
import { Store } from '@ngxs/store';
import { Appointment, Timeslot } from '@org/models';
import { LocalUserState } from '@org/scheduler-ui/state';
import { AvailabilityStatusComponent } from '../availability-status/availability-status.component';
import { formatTimeRange } from '../open-timeslot-card/open-timeslot-card.component';

/** A timeslot of a week that has an appointment, which shows the availability of the current user */
@Component({
  selector: 'lib-appointment-card',
  imports: [AvailabilityStatusComponent],
  templateUrl: './appointment-card.component.html',
  host: {
    class: 'block rounded-lg border-4 border-solid border-outline-variant p-2',
  },
})
export class AppointmentCardComponent {
  readonly timeslot = input.required<Timeslot>();
  readonly appointment = input.required<Appointment>();

  private readonly currentUser = inject(Store).selectSignal(
    LocalUserState.currentUser,
  );

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
}
