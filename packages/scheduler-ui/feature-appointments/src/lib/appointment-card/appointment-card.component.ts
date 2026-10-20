import {
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { Store } from '@ngxs/store';
import {
  Appointment,
  AvailabilityStatus,
  Timeslot,
  UserRole,
} from '@org/models';
import { ExpandableCard } from '@org/scheduler-ui/core-ui';
import {
  LocalUserState,
  SetAvailability,
  UsersState,
} from '@org/scheduler-ui/state';
import { firstValueFrom } from 'rxjs';
import {
  AvailabilitySelectComponent,
  SET_AVAILABILITY_PLACEHOLDER,
} from '../availability-select/availability-select.component';
import { MemberAvailabilityComponent } from '../member-availability/member-availability.component';
import { formatTimeRange } from '../open-timeslot-card/open-timeslot-card.component';

export const EDIT_APPOINTMENT_LABEL = 'Edit appointment';
/** Shown for a member whose user is not known, such as before the users are loaded */
export const UNKNOWN_MEMBER_NAME = 'Unknown member';

/**
 * A timeslot of a week that has an appointment. The current user chooses their availability for it
 * right on the card, and sees the availability of the other members. A coordinator can expand the
 * card to edit the appointment.
 */
@Component({
  selector: 'lib-appointment-card',
  imports: [
    AvailabilitySelectComponent,
    MatIcon,
    MatIconButton,
    MemberAvailabilityComponent,
  ],
  templateUrl: './appointment-card.component.html',
  styleUrl: './appointment-card.component.scss',
})
export class AppointmentCardComponent extends ExpandableCard {
  private readonly store = inject(Store);

  readonly timeslot = input.required<Timeslot>();
  readonly appointment = input.required<Appointment>();

  private readonly currentUser = this.store.selectSignal(
    LocalUserState.currentUser,
  );
  private readonly usersById = this.store.selectSignal(UsersState.usersById);
  private readonly saving = signal(false);
  private readonly editing = signal(false);

  protected readonly placeholder = SET_AVAILABILITY_PLACEHOLDER;
  protected readonly editLabel = EDIT_APPOINTMENT_LABEL;
  protected readonly timeRange = computed(() =>
    formatTimeRange(this.timeslot()),
  );
  /** Only coordinators edit the appointment */
  protected readonly isCoordinator = this.store.selectSignal(
    LocalUserState.hasRole(UserRole.Coordinator),
  );
  /** The status the current user set, if they have */
  protected readonly status = computed(() => {
    const user = this.currentUser();
    return (
      this.appointment().availabilities.find(
        ({ memberId }) => memberId === user?.id,
      )?.status ?? null
    );
  });
  /** The availability of the other members, with their names */
  protected readonly others = computed(() => {
    const user = this.currentUser();
    const users = this.usersById();
    return this.appointment()
      .availabilities.filter(({ memberId }) => memberId !== user?.id)
      .map(({ memberId, status }) => ({
        memberId,
        status,
        name: users[memberId]?.displayName ?? UNKNOWN_MEMBER_NAME,
      }));
  });
  /** The card expands for a coordinator to edit the appointment */
  readonly expanded = this.editing.asReadonly();

  /** The status that is chosen, which is the saved one except while a new choice is being saved */
  protected readonly chosen = linkedSignal(() => this.status());
  /** Availability is for the current user, and is changed once at a time */
  protected readonly canChange = computed(
    () => this.currentUser() !== null && !this.saving(),
  );

  protected toggleEditing(): void {
    this.editing.update((editing) => !editing);
  }

  /** Saves the status the user chose, going back to the saved one if that fails */
  protected async choose(status: AvailabilityStatus | null): Promise<void> {
    const user = this.currentUser();
    if (!user || !status || this.saving()) {
      return;
    }

    this.chosen.set(status);
    this.saving.set(true);
    try {
      await firstValueFrom(
        this.store.dispatch(
          new SetAvailability(this.appointment().appointmentId, {
            memberId: user.id,
            status,
          }),
        ),
      );
    } catch {
      this.chosen.set(this.status());
    } finally {
      this.saving.set(false);
    }
  }
}
